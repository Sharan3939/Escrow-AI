import prisma from "../config/database.js";
import { canReleaseEscrow } from "../services/escrow.service.js";
import * as submissionService from "../services/submission.service.js";

async function runSecurityTests() {
  console.log("======================================================================");
  console.log("  RUNNING DUAL WALLET & ROLE AUTHORIZATION SECURITY TEST SUITE");
  console.log("======================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`       Detail: ${detail}`);
    }
  }

  const timestamp = Date.now();
  const clientAWallet = `addr_test1qpclientA_${timestamp}`;
  const clientBWallet = `addr_test1qpclientB_${timestamp}`;
  const freelancerAWallet = `addr_test1qpfreelancerA_${timestamp}`;
  const freelancerBWallet = `addr_test1qpfreelancerB_${timestamp}`;

  let clientA: any;
  let clientB: any;
  let freelancerA: any;
  let freelancerB: any;
  let projectA: any;
  let projectB: any;

  try {
    // Setup Users
    clientA = await prisma.user.create({
      data: {
        walletAddress: clientAWallet,
        username: `clientA_${timestamp.toString().slice(-4)}`,
        role: "CLIENT",
      },
    });

    clientB = await prisma.user.create({
      data: {
        walletAddress: clientBWallet,
        username: `clientB_${timestamp.toString().slice(-4)}`,
        role: "CLIENT",
      },
    });

    freelancerA = await prisma.user.create({
      data: {
        walletAddress: freelancerAWallet,
        username: `freelancerA_${timestamp.toString().slice(-4)}`,
        role: "FREELANCER",
      },
    });

    freelancerB = await prisma.user.create({
      data: {
        walletAddress: freelancerBWallet,
        username: `freelancerB_${timestamp.toString().slice(-4)}`,
        role: "FREELANCER",
      },
    });

    // Create Project A by Client A assigned to Freelancer A
    projectA = await prisma.project.create({
      data: {
        title: "Security Test Project A",
        description: "Comprehensive 28-byte Aiken Escrow verification project.",
        budget: 100,
        deadline: new Date(Date.now() + 86400000),
        clientId: clientA.id,
        freelancerId: freelancerA.id,
        freelancerWalletAddress: freelancerAWallet,
        status: "ASSIGNED",
        escrow: {
          create: {
            amount: 100,
            status: "FUNDED",
            transactionHash: `tx_lock_${timestamp}_A`,
            fundedAt: new Date(),
          },
        },
      },
      include: { escrow: true },
    });

    // Create Project B by Client B assigned to Freelancer B
    projectB = await prisma.project.create({
      data: {
        title: "Security Test Project B",
        description: "Project for Client B and Freelancer B.",
        budget: 50,
        deadline: new Date(Date.now() + 86400000),
        clientId: clientB.id,
        freelancerId: freelancerB.id,
        freelancerWalletAddress: freelancerBWallet,
        status: "ASSIGNED",
        escrow: {
          create: {
            amount: 50,
            status: "FUNDED",
            transactionHash: `tx_lock_${timestamp}_B`,
            fundedAt: new Date(),
          },
        },
      },
      include: { escrow: true },
    });

    // -----------------------------------------------------------------------
    // TEST 1: Client cannot submit freelancer work on their own project
    // -----------------------------------------------------------------------
    let test1Passed = false;
    try {
      await submissionService.createOrResubmitSubmission(
        clientA.id,
        {
          projectId: projectA.id,
          description: "Client trying to submit work",
        },
        clientAWallet
      );
    } catch (err: any) {
      test1Passed = err.statusCode === 403 || err.message.includes("Clients cannot submit");
    }
    assert(test1Passed, "Client cannot submit freelancer work on project");

    // -----------------------------------------------------------------------
    // TEST 2: Freelancer cannot submit work for another freelancer's project
    // -----------------------------------------------------------------------
    let test2Passed = false;
    try {
      await submissionService.createOrResubmitSubmission(
        freelancerB.id,
        {
          projectId: projectA.id,
          description: "Freelancer B attacking Project A",
        },
        freelancerBWallet
      );
    } catch (err: any) {
      test2Passed = err.statusCode === 403 || err.message.includes("not the assigned freelancer");
    }
    assert(test2Passed, "Freelancer B cannot submit work to Freelancer A's project");

    // -----------------------------------------------------------------------
    // TEST 3: Freelancer cannot submit with a forged/mismatched wallet address
    // -----------------------------------------------------------------------
    let test3Passed = false;
    try {
      await submissionService.createOrResubmitSubmission(
        freelancerA.id,
        {
          projectId: projectA.id,
          description: "Freelancer A submitting with mismatched wallet",
        },
        "addr_test1_spoofed_random_address"
      );
    } catch (err: any) {
      test3Passed = err.statusCode === 403 || err.message.includes("Authenticated wallet address does not match");
    }
    assert(test3Passed, "Freelancer cannot submit with mismatched/forged wallet address");

    // -----------------------------------------------------------------------
    // TEST 4: Legitimate Freelancer A submission succeeds
    // -----------------------------------------------------------------------
    const validSubmission = await submissionService.createOrResubmitSubmission(
      freelancerA.id,
      {
        projectId: projectA.id,
        description: "Completed Aiken Plutus V3 escrow milestone code.",
        githubUrl: "https://github.com/example/escrow-ai",
      },
      freelancerAWallet
    );
    assert(Boolean(validSubmission && validSubmission.id), "Legitimate Freelancer A submission succeeds");

    // -----------------------------------------------------------------------
    // TEST 5: Freelancer cannot approve their own work
    // -----------------------------------------------------------------------
    let test5Passed = false;
    try {
      await submissionService.reviewSubmission(
        freelancerA.id,
        validSubmission.id,
        { action: "APPROVE", feedback: "I approve my own work" }
      );
    } catch (err: any) {
      test5Passed = err.statusCode === 403 || err.message.includes("Only the project client");
    }
    assert(test5Passed, "Freelancer cannot approve their own work");

    // -----------------------------------------------------------------------
    // TEST 6: Different Client B cannot approve Client A's project submission
    // -----------------------------------------------------------------------
    let test6Passed = false;
    try {
      await submissionService.reviewSubmission(
        clientB.id,
        validSubmission.id,
        { action: "APPROVE", feedback: "Client B approving Client A project" }
      );
    } catch (err: any) {
      test6Passed = err.statusCode === 403 || err.message.includes("Only the project client");
    }
    assert(test6Passed, "Different Client B cannot review or approve Client A's project");

    // -----------------------------------------------------------------------
    // TEST 7: AI FAIL blocks release even if Client approves
    // -----------------------------------------------------------------------
    await prisma.submission.update({
      where: { id: validSubmission.id },
      data: {
        aiVerificationStatus: "FAIL",
        clientReviewStatus: "APPROVED",
        status: "APPROVED",
      },
    });
    const eligAiFail = await canReleaseEscrow(projectA.id);
    assert(!eligAiFail.canRelease, "AI FAIL blocks release", eligAiFail.reason);

    // -----------------------------------------------------------------------
    // TEST 8: Client PENDING blocks release
    // -----------------------------------------------------------------------
    await prisma.submission.update({
      where: { id: validSubmission.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "PENDING",
      },
    });
    const eligClientPending = await canReleaseEscrow(projectA.id);
    assert(!eligClientPending.canRelease, "Client PENDING blocks release", eligClientPending.reason);

    // -----------------------------------------------------------------------
    // TEST 9: Client REVISION_REQUESTED blocks release
    // -----------------------------------------------------------------------
    await prisma.submission.update({
      where: { id: validSubmission.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "REVISION_REQUESTED",
      },
    });
    const eligRevision = await canReleaseEscrow(projectA.id);
    assert(!eligRevision.canRelease, "Client REVISION_REQUESTED blocks release", eligRevision.reason);

    // -----------------------------------------------------------------------
    // TEST 10: Missing freelancer wallet address blocks release
    // -----------------------------------------------------------------------
    await prisma.project.update({
      where: { id: projectA.id },
      data: { freelancerWalletAddress: null, freelancerId: null },
    });
    await prisma.submission.update({
      where: { id: validSubmission.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "APPROVED",
      },
    });
    const eligMissingWallet = await canReleaseEscrow(projectA.id);
    assert(!eligMissingWallet.canRelease, "Missing freelancer wallet address blocks release", eligMissingWallet.reason);

    // Restore freelancer wallet
    await prisma.project.update({
      where: { id: projectA.id },
      data: {
        freelancerId: freelancerA.id,
        freelancerWalletAddress: freelancerAWallet,
      },
    });

    // -----------------------------------------------------------------------
    // TEST 11: Dual Approval (AI PASS + Client APPROVED + Funded) -> Release Eligible & Target is Freelancer A
    // -----------------------------------------------------------------------
    const eligSuccess = await canReleaseEscrow(projectA.id);
    assert(
      eligSuccess.canRelease && eligSuccess.details?.freelancerAddress === freelancerAWallet,
      "Dual Approval (AI PASS + Client APPROVED + Funded) allows release to Freelancer A wallet",
      eligSuccess.reason
    );

    // -----------------------------------------------------------------------
    // TEST 12: Already RELEASED blocks duplicate release
    // -----------------------------------------------------------------------
    await prisma.escrow.update({
      where: { id: projectA.escrow!.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
    const eligDuplicate = await canReleaseEscrow(projectA.id);
    assert(!eligDuplicate.canRelease, "Already RELEASED blocks duplicate release", eligDuplicate.reason);

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
  } finally {
    // Cleanup test data
    try {
      if (projectA) {
        await prisma.submission.deleteMany({ where: { projectId: projectA.id } });
        await prisma.escrow.deleteMany({ where: { projectId: projectA.id } });
        await prisma.project.delete({ where: { id: projectA.id } });
      }
      if (projectB) {
        await prisma.submission.deleteMany({ where: { projectId: projectB.id } });
        await prisma.escrow.deleteMany({ where: { projectId: projectB.id } });
        await prisma.project.delete({ where: { id: projectB.id } });
      }
      if (freelancerA) await prisma.user.delete({ where: { id: freelancerA.id } });
      if (freelancerB) await prisma.user.delete({ where: { id: freelancerB.id } });
      if (clientA) await prisma.user.delete({ where: { id: clientA.id } });
      if (clientB) await prisma.user.delete({ where: { id: clientB.id } });
    } catch (e: any) {
      console.warn("Test cleanup note:", e.message);
    }
  }

  if (passedTests === totalTests) {
    console.log("\n>>> ALL 12 DUAL-WALLET & AUTHORIZATION SECURITY TESTS PASSED SUCCESSFULLY! <<<\n");
    process.exit(0);
  } else {
    console.error(`\n>>> FAILED: ${totalTests - passedTests} test(s) failed. <<<\n`);
    process.exit(1);
  }
}

runSecurityTests().catch((err) => {
  console.error("Security test suite error:", err);
  process.exit(1);
});

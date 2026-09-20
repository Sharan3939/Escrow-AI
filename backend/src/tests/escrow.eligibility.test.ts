import { canReleaseEscrow } from "../services/escrow.service.js";
import prisma from "../config/database.js";

async function runEligibilityTests() {
  console.log("=================================================");
  console.log("  RUNNING ESCROW DUAL APPROVAL ELIGIBILITY TESTS");
  console.log("=================================================\n");

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

  // Setup mock IDs for testing
  const mockClientId = "test-client-" + Date.now();
  const mockFreelancerId = "test-freelancer-" + Date.now();
  const mockFreelancerAddress = "addr_test1qrz65538wzq2x98jkv7hqqx0c0s7nduv25f9f6p4s9m6yps77j4p4g94d";

  let testProject: any;
  let clientUser: any;
  let freelancerUser: any;

  try {
    // 1. Create test users
    clientUser = await prisma.user.create({
      data: {
        id: mockClientId,
        walletAddress: "addr_test1qpclient" + Date.now().toString().slice(-8),
        username: "client_" + Date.now().toString().slice(-6),
        role: "CLIENT",
      },
    });

    freelancerUser = await prisma.user.create({
      data: {
        id: mockFreelancerId,
        walletAddress: mockFreelancerAddress,
        username: "freelancer_" + Date.now().toString().slice(-6),
        role: "FREELANCER",
      },
    });

    // 2. Create test project with funded escrow
    testProject = await prisma.project.create({
      data: {
        title: "Test Dual Approval Project",
        description: "Verify that release requires AI PASS + Client APPROVED.",
        budget: 100,
        deadline: new Date(Date.now() + 86400000),
        clientId: clientUser.id,
        freelancerId: freelancerUser.id,
        status: "OPEN",
        escrow: {
          create: {
            amount: 100,
            status: "FUNDED",
            transactionHash: "tx_lock_hash_1234567890abcdef1234567890abcdef1234567890abcdef12345678",
            fundedAt: new Date(),
          },
        },
      },
      include: {
        escrow: true,
      },
    });

    // TEST 1: Unfunded Escrow + AI PASS + Client APPROVED -> NOT eligible
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: { status: "CREATED", transactionHash: null, fundedAt: null },
    });

    const sub1 = await prisma.submission.create({
      data: {
        projectId: testProject.id,
        freelancerId: freelancerUser.id,
        description: "Milestone deliverable notes",
        aiVerificationStatus: "PASS",
        clientReviewStatus: "APPROVED",
        status: "APPROVED",
      },
    });

    const res1 = await canReleaseEscrow(testProject.id);
    assert(!res1.canRelease, "Unfunded Escrow + AI PASS + Client APPROVED -> must NOT be eligible", res1.reason);

    // Re-fund escrow for subsequent tests
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: {
        status: "FUNDED",
        transactionHash: "tx_mock_lock_123",
        fundedAt: new Date(),
      },
    });

    // TEST 2: AI PASS + Client PENDING -> NOT eligible
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "PENDING",
      },
    });
    const res2 = await canReleaseEscrow(testProject.id);
    assert(!res2.canRelease, "AI PASS + Client PENDING -> must NOT be eligible", res2.reason);

    // TEST 3: AI PASS + Client REVISION_REQUESTED -> NOT eligible
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "REVISION_REQUESTED",
      },
    });
    const res3 = await canReleaseEscrow(testProject.id);
    assert(!res3.canRelease, "AI PASS + Client REVISION_REQUESTED -> must NOT be eligible", res3.reason);

    // TEST 4: AI FAIL + Client APPROVED -> NOT eligible
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "FAIL",
        clientReviewStatus: "APPROVED",
      },
    });
    const res4 = await canReleaseEscrow(testProject.id);
    assert(!res4.canRelease, "AI FAIL + Client APPROVED -> must NOT be eligible", res4.reason);

    // TEST 5: AI NEEDS_REVISION + Client APPROVED -> NOT eligible
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "NEEDS_REVISION",
        clientReviewStatus: "APPROVED",
      },
    });
    const res5 = await canReleaseEscrow(testProject.id);
    assert(!res5.canRelease, "AI NEEDS_REVISION + Client APPROVED -> must NOT be eligible", res5.reason);

    // TEST 6: AI PASS + Client APPROVED + DISPUTED -> NOT eligible
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "DISPUTED",
      },
    });
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: { status: "DISPUTED" },
    });
    const res6 = await canReleaseEscrow(testProject.id);
    assert(!res6.canRelease, "AI PASS + Client APPROVED + DISPUTED -> must NOT be eligible", res6.reason);

    // Reset dispute
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: { status: "FUNDED" },
    });

    // TEST 7: AI PASS + Client APPROVED (Funded, no dispute) -> ELIGIBLE FOR RELEASE
    await prisma.submission.update({
      where: { id: sub1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "APPROVED",
        status: "APPROVED",
      },
    });
    const res7 = await canReleaseEscrow(testProject.id);
    assert(res7.canRelease, "AI PASS + Client APPROVED -> MUST BE ELIGIBLE FOR RELEASE", res7.reason);

    // TEST 8: Already RELEASED -> NOT eligible to release again
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: { status: "RELEASED", releasedAt: new Date() },
    });
    const res8 = await canReleaseEscrow(testProject.id);
    assert(!res8.canRelease, "Already RELEASED -> must NOT be eligible to release again", res8.reason);

    // TEST 9: Missing freelancer wallet address -> NOT eligible
    await prisma.escrow.update({
      where: { id: testProject.escrow!.id },
      data: { status: "FUNDED", releasedAt: null },
    });
    await prisma.project.update({
      where: { id: testProject.id },
      data: { freelancerId: null },
    });
    const res9 = await canReleaseEscrow(testProject.id);
    assert(!res9.canRelease, "Missing freelancer wallet -> must NOT be eligible", res9.reason);

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
  } finally {
    // Cleanup test records
    try {
      if (testProject) {
        await prisma.submission.deleteMany({ where: { projectId: testProject.id } });
        await prisma.escrow.deleteMany({ where: { projectId: testProject.id } });
        await prisma.project.delete({ where: { id: testProject.id } });
      }
      if (freelancerUser) {
        await prisma.user.delete({ where: { id: freelancerUser.id } });
      }
      if (clientUser) {
        await prisma.user.delete({ where: { id: clientUser.id } });
      }
    } catch (cleanErr: any) {
      console.warn("Cleanup notice:", cleanErr.message);
    }
  }

  if (passedTests === totalTests) {
    console.log("\n>>> ALL 9 DUAL APPROVAL RELEASE ELIGIBILITY RULES VERIFIED SUCCESSFULLY! <<<\n");
    process.exit(0);
  } else {
    console.error(`\n>>> FAILED: ${totalTests - passedTests} test(s) failed. <<<\n`);
    process.exit(1);
  }
}

runEligibilityTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});

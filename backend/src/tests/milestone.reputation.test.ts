import prisma from "../config/database.js";
import { CreateProjectSchema } from "../validators/index.js";
import * as projectService from "../services/project.service.js";
import * as milestoneService from "../services/milestone.service.js";
import * as reputationService from "../services/reputation.service.js";

async function runMilestoneAndReputationTests() {
  console.log("======================================================================");
  console.log("  RUNNING MILESTONE ESCROW & FREELANCER REPUTATION TEST SUITE (23 TESTS)");
  console.log("======================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`[PASS] Test ${totalTests.toString().padStart(2, " ")}: ${testName}`);
    } else {
      console.error(`[FAIL] Test ${totalTests.toString().padStart(2, " ")}: ${testName}`);
      if (detail) console.error(`        Detail: ${detail}`);
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
  let testProject1: any;
  let testProject2: any;

  try {
    // -----------------------------------------------------------------------
    // SETUP USERS
    // -----------------------------------------------------------------------
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

    // =======================================================================
    // PART 1: MILESTONE VALIDATION & LIFECYCLE TESTS
    // =======================================================================

    // TEST 1: Budget mismatch rejected
    let test1Passed = false;
    try {
      CreateProjectSchema.parse({
        title: "Test Budget Mismatch Project",
        description: "Milestone amounts do not sum to project budget.",
        budget: "100",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        milestones: [
          {
            title: "Milestone 1",
            description: "First part",
            amount: "30",
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            title: "Milestone 2",
            description: "Second part",
            amount: "40", // 30 + 40 = 70 != 100
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      });
    } catch (e: any) {
      test1Passed = true;
    }
    assert(test1Passed, "Budget mismatch rejected when milestone sum != project budget");

    // TEST 2: Correct milestone total accepted
    let test2Passed = false;
    let validatedData: any;
    try {
      validatedData = CreateProjectSchema.parse({
        title: "Test Valid Milestone Project",
        description: "Milestone amounts sum accurately to project budget.",
        budget: "100",
        deadline: new Date(Date.now() + 86400000).toISOString(),
        milestones: [
          {
            title: "Milestone 1: UI Design",
            description: "Design specifications",
            amount: "25",
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            title: "Milestone 2: Development",
            description: "Core logic",
            amount: "35",
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
          {
            title: "Milestone 3: Final Delivery",
            description: "Testing and release",
            amount: "40", // 25 + 35 + 40 = 100 == 100
            deadline: new Date(Date.now() + 86400000).toISOString(),
          },
        ],
      });
      test2Passed = Boolean(validatedData && validatedData.milestones.length === 3);
    } catch (e: any) {
      test2Passed = false;
    }
    assert(test2Passed, "Correct milestone total accepted (25 + 35 + 40 = 100 ADA)");

    // Create test project with 3 milestones in database
    testProject1 = await projectService.createProject(clientA.id, {
      ...validatedData,
      freelancerId: freelancerA.id,
      freelancerAddress: freelancerAWallet,
    });

    const mList = await milestoneService.getMilestonesByProjectId(testProject1.id);
    const m1 = mList[0];
    const m2 = mList[1];
    const m3 = mList[2];

    // TEST 3: Freelancer cannot submit another freelancer's milestone
    let test3Passed = false;
    try {
      await milestoneService.submitMilestoneDeliverable(
        freelancerB.id,
        m1.id,
        {
          description: "Freelancer B attacking Milestone 1",
        },
        freelancerBWallet
      );
    } catch (err: any) {
      test3Passed =
        err.statusCode === 403 ||
        err.message.includes("not the assigned freelancer");
    }
    assert(test3Passed, "Freelancer B cannot submit another freelancer's milestone");

    // Freelancer A submits legitimate work for Milestone 1
    const subM1 = await milestoneService.submitMilestoneDeliverable(
      freelancerA.id,
      m1.id,
      {
        description: "Completed Milestone 1 UI responsive implementation.",
        githubUrl: "https://github.com/example/repo",
      },
      freelancerAWallet
    );

    // TEST 4: AI FAIL blocks milestone release
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "FAIL",
        clientReviewStatus: "APPROVED",
      },
    });
    const eligAiFail = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligAiFail.canRelease, "AI FAIL blocks milestone release", eligAiFail.reason);

    // TEST 5: AI NEEDS_REVISION blocks release
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "NEEDS_REVISION",
        clientReviewStatus: "APPROVED",
      },
    });
    const eligNeedsRev = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligNeedsRev.canRelease, "AI NEEDS_REVISION blocks milestone release", eligNeedsRev.reason);

    // TEST 6: Client PENDING blocks release
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "PENDING",
      },
    });
    const eligPending = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligPending.canRelease, "Client PENDING blocks milestone release", eligPending.reason);

    // TEST 7: Client REVISION_REQUESTED blocks release
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "REVISION_REQUESTED",
      },
    });
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { status: "REVISION_REQUESTED" },
    });
    const eligRevReq = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligRevReq.canRelease, "Client REVISION_REQUESTED blocks release", eligRevReq.reason);

    // TEST 8: DISPUTED blocks milestone release
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "DISPUTED",
      },
    });
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { status: "DISPUTED" },
    });
    const eligDisputed = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligDisputed.canRelease, "DISPUTED blocks milestone release", eligDisputed.reason);

    // TEST 9: Missing freelancer wallet blocks milestone release
    await prisma.project.update({
      where: { id: testProject1.id },
      data: { freelancerWalletAddress: null, freelancerId: null },
    });
    await prisma.submission.update({
      where: { id: subM1.id },
      data: {
        aiVerificationStatus: "PASS",
        clientReviewStatus: "APPROVED",
      },
    });
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { status: "APPROVED" },
    });
    const eligMissingWallet = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligMissingWallet.canRelease, "Missing freelancer wallet blocks milestone release", eligMissingWallet.reason);

    // Restore freelancer wallet
    await prisma.project.update({
      where: { id: testProject1.id },
      data: {
        freelancerId: freelancerA.id,
        freelancerWalletAddress: freelancerAWallet,
      },
    });

    // TEST 10: Unfunded milestone blocks release
    await prisma.escrow.update({
      where: { id: testProject1.escrow.id },
      data: { status: "CREATED", fundedAt: null, transactionHash: null },
    });
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { status: "PENDING" },
    });
    const eligUnfunded = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligUnfunded.canRelease, "Unfunded milestone blocks release", eligUnfunded.reason);

    // Fund escrow on Cardano
    await prisma.escrow.update({
      where: { id: testProject1.escrow.id },
      data: {
        status: "FUNDED",
        fundedAt: new Date(),
        transactionHash: `tx_lock_${timestamp}_1`,
      },
    });
    await prisma.milestone.update({
      where: { id: m1.id },
      data: { status: "APPROVED" },
    });

    // TEST 11: AI PASS + Client APPROVED + funded = release eligible
    const eligPass = await milestoneService.canReleaseMilestone(m1.id);
    assert(
      eligPass.canRelease && eligPass.details?.freelancerAddress === freelancerAWallet,
      "AI PASS + Client APPROVED + funded = release eligible (25 ADA)",
      eligPass.reason
    );

    // TEST 12: Already RELEASED blocks duplicate release
    const releaseRes1 = await milestoneService.releaseMilestone(
      m1.id,
      `tx_release_${timestamp}_m1`
    );
    const eligDuplicate = await milestoneService.canReleaseMilestone(m1.id);
    assert(!eligDuplicate.canRelease, "Already RELEASED blocks duplicate release", eligDuplicate.reason);

    // TEST 13: Releasing milestone 1 does not mark project completed
    const projAfterM1 = await prisma.project.findUnique({
      where: { id: testProject1.id },
    });
    assert(
      !releaseRes1.projectCompleted && projAfterM1?.status !== "COMPLETED",
      "Releasing milestone 1 does NOT mark project completed (Status is still active)"
    );

    // TEST 14: All milestones released marks project completed
    // Submit & Approve & Release Milestone 2 (35 ADA)
    const subM2 = await milestoneService.submitMilestoneDeliverable(
      freelancerA.id,
      m2.id,
      { description: "Milestone 2 deliverable notes" },
      freelancerAWallet
    );
    await prisma.submission.update({
      where: { id: subM2.id },
      data: { aiVerificationStatus: "PASS", clientReviewStatus: "APPROVED" },
    });
    await milestoneService.releaseMilestone(m2.id, `tx_release_${timestamp}_m2`);

    // Submit & Approve & Release Milestone 3 (40 ADA)
    const subM3 = await milestoneService.submitMilestoneDeliverable(
      freelancerA.id,
      m3.id,
      { description: "Milestone 3 deliverable notes" },
      freelancerAWallet
    );
    await prisma.submission.update({
      where: { id: subM3.id },
      data: { aiVerificationStatus: "PASS", clientReviewStatus: "APPROVED" },
    });
    const releaseRes3 = await milestoneService.releaseMilestone(
      m3.id,
      `tx_release_${timestamp}_m3`
    );

    const projAfterAllM = await prisma.project.findUnique({
      where: { id: testProject1.id },
    });
    assert(
      releaseRes3.projectCompleted && projAfterAllM?.status === "COMPLETED",
      "All milestones released marks project COMPLETED (100% finished)"
    );

    // =======================================================================
    // PART 2: REPUTATION & RATING SYSTEM TESTS
    // =======================================================================

    // TEST 15: Unfunded project gives no reputation
    testProject2 = await projectService.createProject(clientB.id, {
      title: "Unfunded Project 2",
      description: "This project was never funded or completed.",
      budget: "500",
      deadline: new Date(Date.now() + 86400000).toISOString(),
      freelancerId: freelancerB.id,
      freelancerAddress: freelancerBWallet,
    });
    const repFreelancerB_Init = await reputationService.getFreelancerProfile(freelancerB.id);
    assert(
      repFreelancerB_Init.profile.completedProjects === 0 &&
        Number(repFreelancerB_Init.profile.totalAdaEarned) === 0,
      "Unfunded project gives no reputation"
    );

    // TEST 16: Cancelled project gives no reputation
    await prisma.project.update({
      where: { id: testProject2.id },
      data: { status: "CANCELLED" },
    });
    const repFreelancerB_Cancelled = await reputationService.getFreelancerProfile(freelancerB.id);
    assert(
      repFreelancerB_Cancelled.profile.completedProjects === 0,
      "Cancelled project gives no reputation"
    );

    // TEST 17: Completed project increases completedProjects
    const repFreelancerA = await reputationService.getFreelancerProfile(freelancerA.id);
    assert(
      repFreelancerA.profile.completedProjects === 1,
      "Completed project increases completedProjects to 1"
    );

    // TEST 18: Actual released ADA updates totalAdaEarned
    assert(
      Number(repFreelancerA.profile.totalAdaEarned) === 100,
      "Actual released ADA accurately updates totalAdaEarned (100 ADA)"
    );

    // TEST 19: One project counts only once
    await reputationService.recordProjectCompletion(testProject1.id);
    const repFreelancerA_Recheck = await reputationService.getFreelancerProfile(freelancerA.id);
    assert(
      repFreelancerA_Recheck.profile.completedProjects === 1,
      "One project counts only once (Idempotent reputation calculation)"
    );

    // TEST 20: Duplicate review rejected
    // Legitimate Client A reviews Freelancer A
    await reputationService.submitProjectReview(
      clientA.id,
      testProject1.id,
      5,
      "Outstanding work on Cardano Plutus V3 milestones!"
    );

    let test20Passed = false;
    try {
      await reputationService.submitProjectReview(
        clientA.id,
        testProject1.id,
        4,
        "Trying to submit duplicate review"
      );
    } catch (err: any) {
      test20Passed =
        err.status === 400 ||
        err.statusCode === 400 ||
        err.message.includes("already been submitted");
    }
    assert(test20Passed, "Duplicate review rejected");

    // TEST 21: Freelancer cannot review themselves
    let test21Passed = false;
    try {
      await reputationService.submitProjectReview(
        freelancerA.id,
        testProject1.id,
        5,
        "I am rating myself 5 stars"
      );
    } catch (err: any) {
      test21Passed =
        err.status === 400 ||
        err.statusCode === 400 ||
        err.status === 403 ||
        err.statusCode === 403 ||
        err.message.includes("cannot review themselves");
    }
    assert(test21Passed, "Freelancer cannot review themselves");

    // TEST 22: Unrelated client cannot review freelancer
    let test22Passed = false;
    try {
      await reputationService.submitProjectReview(
        clientB.id,
        testProject1.id,
        1,
        "Unrelated Client B attacking Client A's project"
      );
    } catch (err: any) {
      test22Passed =
        err.status === 403 ||
        err.statusCode === 403 ||
        err.message.includes("Only the project client");
    }
    assert(test22Passed, "Unrelated client cannot review freelancer");

    // TEST 23: Rating average calculated correctly
    const finalProfile = await reputationService.getFreelancerProfile(freelancerA.id);
    assert(
      Number(finalProfile.profile.averageRating) === 5.0 &&
        finalProfile.profile.ratingCount === 1,
      "Rating average calculated correctly (5.0 / 5 with 1 review)"
    );

    console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
  } finally {
    // Cleanup test records
    try {
      if (testProject1) {
        await prisma.freelancerReview.deleteMany({ where: { projectId: testProject1.id } });
        await prisma.submission.deleteMany({ where: { projectId: testProject1.id } });
        await prisma.milestone.deleteMany({ where: { projectId: testProject1.id } });
        await prisma.escrow.deleteMany({ where: { projectId: testProject1.id } });
        await prisma.project.delete({ where: { id: testProject1.id } });
      }
      if (testProject2) {
        await prisma.milestone.deleteMany({ where: { projectId: testProject2.id } });
        await prisma.escrow.deleteMany({ where: { projectId: testProject2.id } });
        await prisma.project.delete({ where: { id: testProject2.id } });
      }
      if (freelancerA) {
        await prisma.freelancerProfile.deleteMany({ where: { userId: freelancerA.id } });
        await prisma.user.delete({ where: { id: freelancerA.id } });
      }
      if (freelancerB) {
        await prisma.freelancerProfile.deleteMany({ where: { userId: freelancerB.id } });
        await prisma.user.delete({ where: { id: freelancerB.id } });
      }
      if (clientA) await prisma.user.delete({ where: { id: clientA.id } });
      if (clientB) await prisma.user.delete({ where: { id: clientB.id } });
    } catch (e: any) {
      console.warn("Cleanup note:", e.message);
    }
  }

  if (passedTests === totalTests) {
    console.log("\n>>> ALL 23 MILESTONE & FREELANCER REPUTATION TESTS PASSED SUCCESSFULLY! <<<\n");
    process.exit(0);
  } else {
    console.error(`\n>>> FAILED: ${totalTests - passedTests} test(s) failed. <<<\n`);
    process.exit(1);
  }
}

runMilestoneAndReputationTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});

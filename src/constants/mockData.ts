import type { AIReportItem, EscrowItem, ProjectItem, TransactionItem } from "@/src/types";

export const landingFeatures = [
  {
    title: "Trustless milestones",
    description: "Launch ADA-backed escrow with automatic fund release once conditions are met.",
  },
  {
    title: "AI submission checks",
    description: "Gemini evaluates deliverables for completeness, relevance, and quality.",
  },
  {
    title: "Cardano-native",
    description: "Built for fast, low-fee on-chain workflows with transparent settlement.",
  },
];

export const steps = [
  "Create a project brief and fund the escrow in ADA.",
  "Freelancers accept the milestone and submit work.",
  "AI review and client approval release funds automatically.",
];

export const roadmap = [
  "V1 launch with milestone escrow and AI review.",
  "Multi-signature governance and reputation layers.",
  "Cross-chain invoice tooling and DAO treasury support.",
];

export const activeEscrows: EscrowItem[] = [
  {
    id: "esc-101",
    title: "DeFi analytics dashboard",
    client: "Apex Labs",
    amount: "2,400 ADA",
    status: "In review",
    due: "2 days left",
    progress: 72,
  },
  {
    id: "esc-102",
    title: "NFT marketplace landing page",
    client: "Sora Studio",
    amount: "860 ADA",
    status: "Awaiting upload",
    due: "5 days left",
    progress: 44,
  },
];

export const clientProjects: ProjectItem[] = [
  {
    id: "prj-001",
    title: "Smart contract audit portal",
    client: "Northwind",
    budget: "4,200 ADA",
    timeline: "3 weeks",
    tags: ["Research", "Security"],
  },
  {
    id: "prj-002",
    title: "On-chain identity onboarding",
    client: "Lumen DAO",
    budget: "1,800 ADA",
    timeline: "10 days",
    tags: ["UX", "Product"],
  },
];

export const transactions: TransactionItem[] = [
  {
    id: "txn-001",
    title: "Escrow funded",
    amount: "+1,200 ADA",
    time: "10m ago",
    type: "Deposit",
  },
  {
    id: "txn-002",
    title: "Milestone released",
    amount: "-320 ADA",
    time: "1h ago",
    type: "Release",
  },
  {
    id: "txn-003",
    title: "AI review passed",
    amount: "+180 ADA",
    time: "Today",
    type: "Milestone",
  },
];

export const aiReports: AIReportItem[] = [
  {
    id: "report-001",
    title: "Submission quality",
    score: 94,
    summary: "Strong completion, clear documentation, and well-structured visuals.",
  },
  {
    id: "report-002",
    title: "Risk assessment",
    score: 81,
    summary: "Minor inconsistencies in requirement traceability, but overall delivery is solid.",
  },
];

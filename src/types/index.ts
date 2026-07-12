export type NavItem = {
  label: string;
  href: string;
  active?: boolean;
};

export type EscrowItem = {
  id: string;
  title: string;
  client: string;
  amount: string;
  status: string;
  due: string;
  progress: number;
};

export type ProjectItem = {
  id: string;
  title: string;
  client: string;
  budget: string;
  timeline: string;
  tags: string[];
};

export type TransactionItem = {
  id: string;
  title: string;
  amount: string;
  time: string;
  type: "Deposit" | "Release" | "Milestone";
};

export type AIReportItem = {
  id: string;
  title: string;
  score: number;
  summary: string;
};

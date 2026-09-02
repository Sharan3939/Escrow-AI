import { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

export function useDashboardData() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<{
    escrows: any[];
    transactions: any[];
    aiReports: any[];
  }>({
    escrows: [],
    transactions: [],
    aiReports: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await apiClient.get<any>("/projects");
        const projects = res.data || [];

        const escrows = projects
          .filter((p: any) => p.escrow)
          .map((p: any) => {
            const status = (p.escrow.status || "CREATED").toUpperCase();
            return {
              ...p.escrow,
              projectId: p.id,
              title: p.title,
              projectTitle: p.title,
              role: "Development",
              client: p.client?.username || "Verified Client",
              deadline: p.deadline,
              due: new Date(p.deadline).toLocaleDateString(),
              amount: `${p.budget} ADA`,
              progress:
                status === "RELEASED" ? 100 : status === "LOCKED" ? 65 : 30,
              status,
            };
          });

        const transactions: any[] = [];
        const aiReports: any[] = [];

        for (const p of projects) {
          if (Array.isArray(p.transactions)) {
            for (const tx of p.transactions) {
              transactions.push({
                id: tx.id,
                title: `${p.title} (${tx.type})`,
                time: new Date(tx.createdAt).toLocaleDateString(),
                amount: `${tx.amount} ADA`,
                type: tx.type,
              });
            }
          }

          if (Array.isArray(p.submissions)) {
            for (const sub of p.submissions) {
              if (sub.aiReport) {
                try {
                  const parsed = JSON.parse(sub.aiReport);
                  aiReports.push({
                    id: sub.id,
                    title: p.title,
                    score: parsed.qualityScore || sub.aiScore || 85,
                    summary:
                      parsed.projectSummary ||
                      "Automated verification evaluated against requirements.",
                  });
                } catch (_) {}
              }
            }
          }
        }

        setData({
          escrows: escrows.slice(0, 6),
          transactions: transactions.slice(0, 6),
          aiReports: aiReports.slice(0, 6),
        });
        setError(null);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isAuthenticated]);

  return { data, loading, error };
}

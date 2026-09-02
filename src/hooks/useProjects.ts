import { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

export function useProjects() {
  const { isAuthenticated } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const res = await apiClient.get<any>("/projects");
        setProjects(res.data || []);
        setError(null);
      } catch (err: any) {
        console.error("Projects fetch error:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, [isAuthenticated]);

  return { projects, loading, error };
}

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../services/api";
import { useAuthStore } from "../store/useAuthStore";

export function useProjects() {
  const { isAuthenticated } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
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
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, error, refetch: fetchProjects };
}


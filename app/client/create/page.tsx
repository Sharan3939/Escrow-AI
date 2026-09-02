"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/src/components/layout/PageShell";
import { apiClient } from "@/src/services/api";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    freelancerAddress: "", // Add if needed, or leave blank
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiClient.post("/projects", {
        ...formData,
        budget: Number(formData.budget),
        deadline: new Date(formData.deadline).toISOString(),
      });
      alert("Project created successfully!");
      router.push("/client/projects");
    } catch (err: any) {
      console.error("Create error:", err);
      alert("Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
    <PageShell
      title="Create a new escrow"
      subtitle="Define the scope, set the ADA amount, and launch a milestone-based freelance contract."
      action={<Button variant="secondary">Preview contract</Button>}
    >
      <Card className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Project title</span>
            <input 
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" 
              placeholder="Web3 analytics dashboard" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>ADA amount</span>
            <input 
              type="number"
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" 
              placeholder="2400" 
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </label>
        </div>
        <label className="space-y-2 text-sm text-slate-300">
          <span>Description</span>
          <textarea 
            className="min-h-32 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" 
            placeholder="Describe the expected deliverables, acceptance criteria, and timeline." 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-slate-300">
            <span>Deadline</span>
            <input 
              type="date" 
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0" 
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Category</span>
            <select className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none ring-0">
              <option>Design</option>
              <option>Development</option>
              <option>Research</option>
            </select>
          </label>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" disabled={loading}>Save draft</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Launch escrow"}</Button>
        </div>
      </Card>
    </PageShell>
    </ProtectedRoute>
  );
}

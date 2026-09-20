"use client";

import { useState } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { ProjectCard } from "@/src/components/ui/ProjectCard";
import { Button } from "@/src/components/ui/Button";
import { useProjects } from "@/src/hooks/useProjects";
import { ProtectedRoute } from "@/src/components/layout/ProtectedRoute";
import { apiClient } from "@/src/services/api";
import { Toast } from "@/src/components/ui/Toast";
import { Card } from "@/src/components/ui/Card";
import { Plus, Trash2, AlertTriangle, X, ShieldAlert, Loader2 } from "lucide-react";

export default function ClientProjectsPage() {
  const { projects, loading, error, refetch } = useProjects();
  const [projectToDelete, setProjectToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  const showToast = (
    title: string,
    description: string,
    variant: "success" | "error" | "info" = "info"
  ) => {
    setToast({ title, description, variant });
    setTimeout(() => {
      setToast((current) => (current?.title === title ? null : current));
    }, 6000);
  };

  const handleDeleteRequest = (project: any) => {
    const escrowStatus = (project.escrow?.status || "CREATED").toUpperCase();
    const isOnChain =
      escrowStatus === "LOCKED" ||
      escrowStatus === "RELEASED" ||
      Boolean(project.escrow?.transactionHash) ||
      Boolean(project.escrow?.fundedAt) ||
      (Boolean(project.escrow?.blockchainStatus) &&
        project.escrow.blockchainStatus !== "CREATED");

    if (isOnChain) {
      setBlockedNotice(
        `Cannot delete "${project.title}": Escrow has already been funded or submitted on-chain. Cardano smart contracts cannot be deleted off-chain once funded.`
      );
      return;
    }

    setProjectToDelete(project);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/projects/${projectToDelete.id}`);
      showToast(
        "Project Deleted",
        `"${projectToDelete.title}" was successfully deleted.`,
        "success"
      );
      setProjectToDelete(null);
      await refetch();
    } catch (err: any) {
      console.error("Delete project failed:", err);
      const errorMsg =
        (err && typeof err === "object" && "error" in err && err.error) ||
        err.message ||
        "Failed to delete project. Please try again.";
      showToast("Deletion Failed", String(errorMsg), "error");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-cyan-300 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading projects...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (error && projects.length === 0) {
    return (
      <ProtectedRoute>
        <div className="p-8 text-rose-400">{error}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageShell
        title="Client project workspace"
        subtitle="Manage active briefs, review freelancers, and keep every milestone on track."
        action={
          <Button href="/client/create" className="px-5 py-2.5">
            <span className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Escrow
            </span>
          </Button>
        }
      >
        {/* Toast Notification Container */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4">
            <Toast
              title={toast.title}
              description={toast.description}
              variant={toast.variant}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {projects.length > 0 ? (
            projects.map((project: any) => (
              <ProjectCard
                key={project.id}
                item={project}
                onDelete={handleDeleteRequest}
                isDeleting={isDeleting && projectToDelete?.id === project.id}
              />
            ))
          ) : (
            <div className="col-span-2 text-center py-12 border border-dashed border-white/10 rounded-2xl p-8 space-y-4">
              <p className="text-slate-400">No projects or escrows found yet.</p>
              <Button href="/client/create">Create Your First Escrow</Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {projectToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
            <Card className="w-full max-w-lg space-y-5 border-rose-500/30 bg-slate-900/95 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-rose-500/10 p-2 text-rose-400 border border-rose-500/20">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Delete Project</h3>
                    <p className="text-xs text-slate-400">Confirmation required</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isDeleting && setProjectToDelete(null)}
                  disabled={isDeleting}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 rounded-xl bg-slate-950/60 p-4 border border-white/5">
                <p className="text-sm font-medium text-white break-words">
                  {projectToDelete.title}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Budget: <strong className="text-cyan-300">{projectToDelete.budget} ADA</strong></span>
                  <span>Status: <strong className="text-emerald-400">{projectToDelete.status}</strong></span>
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Are you sure you want to delete this project? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setProjectToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Project</span>
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* On-Chain Blocked Notice Dialog */}
        {blockedNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-md">
            <Card className="w-full max-w-lg space-y-4 border-amber-500/30 bg-slate-900/95 shadow-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Deletion Blocked
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBlockedNotice(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                {blockedNotice}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setBlockedNotice(null)}
                  className="px-5 py-2 text-sm"
                >
                  Understood
                </Button>
              </div>
            </Card>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}


"use client";

import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ListChecks,
  Info,
} from "lucide-react";
import type { AIReportType } from "../services/aiService";

export function AIReport({
  report,
  analyzedAt,
  revisionCount,
}: {
  report: AIReportType;
  analyzedAt?: string;
  revisionCount?: number;
}) {
  const status = (report.status || "PASS").toUpperCase();
  const score = report.score ?? report.qualityScore ?? 0;
  const summary = report.summary || report.projectSummary || "Deliverable evaluated against scope requirements.";
  const requirements = report.requirements || [];
  const missing = report.missingRequirements || [];
  const suggestions = report.suggestions || [];

  const getStatusBadge = () => {
    switch (status) {
      case "PASS":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Verification: PASS</span>
          </div>
        );
      case "NEEDS_REVISION":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>AI Verification: NEEDS REVISION</span>
          </div>
        );
      case "FAIL":
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <ShieldX className="w-4 h-4 text-rose-400" />
            <span>AI Verification: FAIL</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-300 text-xs font-bold uppercase tracking-wider">
            <Info className="w-4 h-4 text-slate-400" />
            <span>AI Status: {status}</span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 border border-white/10 rounded-2xl bg-slate-900/90 backdrop-blur-md shadow-2xl"
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              Gemini AI Milestone Review
            </h2>
            {typeof revisionCount === "number" && (
              <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-[11px] font-mono text-cyan-300">
                Revision #{revisionCount}
              </span>
            )}
          </div>
          {analyzedAt && (
            <p className="text-xs text-slate-400">
              Evaluated on: {new Date(analyzedAt).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {getStatusBadge()}
          <div className="text-right pl-3 border-l border-white/10">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">Quality Score</p>
            <div className="text-2xl font-black text-white">
              {score}
              <span className="text-xs font-normal text-slate-400">/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>Verification Summary</span>
        </h3>
        <p className="text-slate-300 text-sm leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-white/5">
          {summary}
        </p>
      </div>

      {/* Itemized Requirements Evaluation */}
      {requirements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-violet-400" />
            <span>Requirements Breakdown</span>
          </h3>
          <div className="grid gap-2.5">
            {requirements.map((req, idx) => {
              const isPass = req.status === "PASS";
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                    isPass
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-100"
                      : "bg-rose-950/20 border-rose-500/20 text-rose-100"
                  }`}
                >
                  {isPass ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{req.requirement}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isPass ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    {req.reason && <p className="text-slate-300 text-[11px] leading-relaxed">{req.reason}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Missing Requirements & Suggestions */}
      <div className="grid gap-4 md:grid-cols-2">
        {missing.length > 0 ? (
          <div className="space-y-2 p-4 rounded-xl bg-amber-950/20 border border-amber-500/20">
            <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Missing or Incomplete Items</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-200/90 list-disc list-inside">
              {missing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-emerald-300">
              <p className="font-semibold">All Specified Scope Items Present</p>
              <p className="text-[11px] text-slate-400">
                Gemini detected delivery of the agreed functional milestones.
              </p>
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2 p-4 rounded-xl bg-violet-950/20 border border-violet-500/20">
            <h3 className="text-xs font-semibold text-violet-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-violet-400" />
              <span>AI Recommendations</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
              {suggestions.map((sug, i) => (
                <li key={i}>{sug}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Advisory Notice */}
      <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p>
          <strong>EscrowAI Dual Approval Protocol:</strong> Gemini AI provides automated technical verification. Release of funds to the freelancer additionally requires explicit client satisfaction approval.
        </p>
      </div>
    </motion.div>
  );
}

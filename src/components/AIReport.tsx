"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Shield, CheckCircle2, XCircle, AlertTriangle, Lightbulb } from "lucide-react";
import type { AIReportType } from "../services/aiService";

export function AIReport({ report, analyzedAt }: { report: AIReportType; analyzedAt?: string }) {
  const getRiskColor = (level: string) => {
    switch (level.toUpperCase()) {
      case "LOW": return "text-green-500 bg-green-500/10";
      case "MEDIUM": return "text-yellow-500 bg-yellow-500/10";
      case "HIGH": return "text-red-500 bg-red-500/10";
      default: return "text-gray-500 bg-gray-500/10";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level.toUpperCase()) {
      case "LOW": return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case "MEDIUM": return <ShieldAlert className="w-5 h-5 text-yellow-500" />;
      case "HIGH": return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-400">
            Gemini AI Verification
          </h2>
          {analyzedAt && (
            <p className="text-sm text-gray-400 mt-1">
              Analyzed on: {new Date(analyzedAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Score</p>
            <div className="text-3xl font-bold text-white">
              {report.qualityScore}<span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              Summary
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed bg-black/20 p-4 rounded-lg">
              {report.projectSummary}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Completion</h3>
              <span className="text-sm font-medium text-white">{report.completionPercentage}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-violet-500 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${report.completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Missing Requirements
            </h3>
            {report.missingRequirements.length > 0 ? (
              <ul className="space-y-2">
                {report.missingRequirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                    <XCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-400 flex items-center gap-2 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-4 h-4" /> All requirements met
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              {getRiskIcon(report.riskLevel)}
              Risk Level
            </h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(report.riskLevel)}`}>
              {report.riskLevel.toUpperCase()} RISK
            </div>
          </div>

          {report.fraudIndicators.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Fraud Indicators
              </h3>
              <ul className="space-y-2">
                {report.fraudIndicators.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-200 bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Suggestions
            </h3>
            <ul className="space-y-2">
              {report.suggestions.map((sug, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0 mt-1.5" />
                  <span>{sug}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastProps = {
  title: string;
  description: string;
  variant?: "success" | "error" | "info";
  onClose?: () => void;
};

export function Toast({ title, description, variant = "info", onClose }: ToastProps) {
  const borderAndBg =
    variant === "success"
      ? "border-emerald-500/30 bg-slate-900/95 shadow-emerald-500/10 text-emerald-400"
      : variant === "error"
      ? "border-rose-500/30 bg-slate-900/95 shadow-rose-500/10 text-rose-400"
      : "border-cyan-400/20 bg-slate-900/95 shadow-cyan-500/10 text-cyan-400";

  return (
    <div
      className={`relative flex items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${borderAndBg}`}
    >
      <div className="mt-0.5 shrink-0">
        {variant === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        {variant === "error" && <AlertTriangle className="w-5 h-5 text-rose-400" />}
        {variant === "info" && <Info className="w-5 h-5 text-cyan-400" />}
      </div>
      <div className="flex-1 pr-2">
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{description}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}


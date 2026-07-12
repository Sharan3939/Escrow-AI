type ToastProps = {
  title: string;
  description: string;
};

export function Toast({ title, description }: ToastProps) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/90 px-4 py-3 shadow-lg shadow-cyan-500/10">
      <p className="font-semibold text-white">{title}</p>
      <p className="text-sm text-slate-400">{description}</p>
    </div>
  );
}

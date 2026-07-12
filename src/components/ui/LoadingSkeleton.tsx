export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 h-4 w-24 rounded-full bg-slate-700" />
          <div className="mb-2 h-6 w-3/4 rounded-full bg-slate-700" />
          <div className="h-4 w-full rounded-full bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

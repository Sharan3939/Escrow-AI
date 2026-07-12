import { UploadCloud } from "lucide-react";

export function FileUploader() {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-cyan-400/40 bg-cyan-500/10 px-6 py-12 text-center transition hover:border-cyan-300 hover:bg-cyan-500/20">
      <UploadCloud className="mb-4 h-10 w-10 text-cyan-300" />
      <span className="text-lg font-semibold text-white">Drop files here</span>
      <span className="mt-2 text-sm text-slate-400">PNG, PDF, ZIP, or a short Loom link</span>
      <input type="file" className="hidden" />
    </label>
  );
}

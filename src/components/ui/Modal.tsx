import type { ReactNode } from "react";
import { Card } from "@/src/components/ui/Card";

type ModalProps = {
  children: ReactNode;
  title: string;
};

export function Modal({ children, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-6 py-10 backdrop-blur-lg">
      <Card className="w-full max-w-xl space-y-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {children}
      </Card>
    </div>
  );
}

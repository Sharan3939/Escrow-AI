import type { TransactionItem } from "@/src/types";
import { Card } from "@/src/components/ui/Card";

type TransactionCardProps = {
  item: TransactionItem;
};

export function TransactionCard({ item }: TransactionCardProps) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{item.title}</p>
        <p className="text-sm text-slate-400">{item.time}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-white">{item.amount}</p>
        <p className="text-sm text-cyan-300">{item.type}</p>
      </div>
    </Card>
  );
}

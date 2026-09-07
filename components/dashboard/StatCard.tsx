import { Card } from "@/components/ui/Card";

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <span className="text-2xl font-bold text-text-primary">{value}</span>
    </Card>
  );
}

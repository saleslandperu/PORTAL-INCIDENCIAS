interface KpiCardProps {
  label: string;
  value: number;
  tone: "total" | "open" | "pending" | "resolved" | "overdue";
}

export function KpiCard({ label, value, tone }: KpiCardProps) {
  return (
    <article className={`card kpi ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

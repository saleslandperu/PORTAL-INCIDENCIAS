import type { IncidentPriority, IncidentStatus } from "../types/incident";

export function StatusChip({ value }: { value: IncidentStatus }) {
  const cls = value.startsWith("En") ? "En" : value;
  return <span className={`chip ${cls}`}>{value}</span>;
}

export function PriorityChip({ value }: { value: IncidentPriority }) {
  return <span className={`chip ${value}`}>{value}</span>;
}

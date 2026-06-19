const LABELS = {
  unknown: "Unknown",
  operational: "Operational",
  degraded: "Degraded",
  down: "Down",
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  success: "Success",
  failure: "Failure"
};

export default function StatusBadge({ value }) {
  const normalizedValue = value || "unknown";

  return (
    <span className={`status-badge status-${normalizedValue}`}>
      {LABELS[normalizedValue] || normalizedValue}
    </span>
  );
}

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function statusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function variantForStatus(status: string): NonNullable<BadgeProps["variant"]> {
  const key = normalizeStatus(status);

  if (key === "approved" || key === "paid" || key === "completed" || key === "active") {
    return "success";
  }

  if (
    key === "pending" ||
    key === "sent" ||
    key === "sent_to_client" ||
    key === "viewed" ||
    key === "issued" ||
    key === "needs_review" ||
    key === "clarification_requested" ||
    key === "partially_paid"
  ) {
    return "warning";
  }

  if (key === "rejected" || key === "void" || key === "overdue" || key === "withdrawn") {
    return "destructive";
  }

  if (key === "draft" || key === "new" || key === "archived") {
    return "muted";
  }

  return "secondary";
}

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: string;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={variantForStatus(status)} className={cn("capitalize", className)} {...props}>
      {statusLabel(status)}
    </Badge>
  );
}

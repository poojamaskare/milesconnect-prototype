import type { ReactNode } from "react";

export type ShipmentLifecycleStatus =
  | "Created"
  | "Assigned"
  | "In Transit"
  | "Delivered";

const ORDER: ShipmentLifecycleStatus[] = [
  "Created",
  "Assigned",
  "In Transit",
  "Delivered",
];

function Dot({ state }: { state: "complete" | "current" | "upcoming" }) {
  const base = "h-2.5 w-2.5 rounded-full";
  const cls =
    state === "complete"
      ? "bg-emerald-500"
      : state === "current"
        ? "bg-sky-500"
        : "bg-foreground/20";

  return <span aria-hidden="true" className={`${base} ${cls}`} />;
}

function StepLabel({
  title,
  meta,
}: {
  title: string;
  meta?: ReactNode;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        {meta ? <div className="text-xs text-foreground/60">{meta}</div> : null}
      </div>
    </div>
  );
}

export default function ShipmentStatusTimeline({
  current,
  timestamps,
  className,
}: {
  current: ShipmentLifecycleStatus;
  timestamps?: Partial<Record<ShipmentLifecycleStatus, string>>;
  className?: string;
}) {
  const currentIdx = ORDER.indexOf(current);

  return (
    <ol className={className ?? ""} aria-label="Shipment status timeline">
      {ORDER.map((status, idx) => {
        const state: "complete" | "current" | "upcoming" =
          idx < currentIdx ? "complete" : idx === currentIdx ? "current" : "upcoming";
        const last = idx === ORDER.length - 1;

        return (
          <li key={status} className="flex items-start gap-3">
            <div className="flex flex-col items-center" aria-hidden="true">
              <Dot state={state} />
              {!last ? <span className="mt-1 h-8 w-px bg-foreground/10" /> : null}
            </div>

            <div className="min-w-0 flex-1 pb-3">
              <StepLabel
                title={status}
                meta={timestamps?.[status]}
              />
              {state === "current" ? (
                <div className="mt-1 text-xs text-foreground/60">Current step</div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

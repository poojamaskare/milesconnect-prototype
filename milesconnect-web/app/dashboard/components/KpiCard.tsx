import Link from "next/link";

export type KpiTrend = {
  label: string;
  tone?: "positive" | "negative" | "neutral";
};

export type RealtimeBadge =
  | boolean
  | {
    label?: string;
  };

export type KpiCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent?:
  | "shipments"
  | "transit"
  | "delivered"
  | "revenue"
  | "sky"
  | "amber"
  | "emerald"
  | "violet"
  | "rose";
  className?: string;
  href?: string;
  subtitle?: string;
  trend?: KpiTrend;
  realtime?: RealtimeBadge;
};

function TrendPill({ trend }: { trend: KpiTrend }) {
  const tone = trend.tone ?? "neutral";
  const cls =
    tone === "positive"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
      : tone === "negative"
        ? "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-300"
        : "border-foreground/10 bg-card text-foreground/70";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs ${cls}`}
    >
      {trend.label}
    </span>
  );
}

function RealtimePill({ realtime }: { realtime?: RealtimeBadge }) {
  if (!realtime) return null;
  const label =
    typeof realtime === "object" && realtime.label ? realtime.label : "Live";

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-card px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function KpiCard(props: KpiCardProps) {
  const { title, value, icon, subtitle, trend, realtime, href, accent, className } = props;

  const resolvedAccent =
    accent === "shipments"
      ? "sky"
      : accent === "transit"
        ? "amber"
        : accent === "delivered"
          ? "emerald"
          : accent === "revenue"
            ? "violet"
            : accent;

  const accentStyles =
    resolvedAccent === "sky"
      ? {
        cardTop: "border-t-sky-500/35",
        icon: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/20",
      }
      : resolvedAccent === "amber"
        ? {
          cardTop: "border-t-amber-500/35",
          icon: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
        }
        : resolvedAccent === "emerald"
          ? {
            cardTop: "border-t-emerald-500/35",
            icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
          }
          : resolvedAccent === "violet"
            ? {
              cardTop: "border-t-violet-500/35",
              icon: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
            }
            : resolvedAccent === "rose"
              ? {
                cardTop: "border-t-rose-500/35",
                icon: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
              }
              : {
                cardTop: "border-t-foreground/10",
                icon: "bg-card text-foreground/80 border-foreground/10",
              };

  const content = (
    <div
      className={`group relative h-full min-h-[124px] overflow-hidden rounded-xl border border-foreground/10 border-t-2 bg-card p-4 outline-none transition-all duration-300 hover:border-foreground/20 hover:shadow-lg hover:-translate-y-0.5 ${accentStyles.cardTop} ${className ?? ""}`}
    >
      {/* Background Glow Effect */}
      <div className={`absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 opacity-0 group-hover:opacity-20 ${resolvedAccent === 'sky' ? 'bg-sky-500' :
        resolvedAccent === 'amber' ? 'bg-amber-500' :
          resolvedAccent === 'emerald' ? 'bg-emerald-500' :
            resolvedAccent === 'violet' ? 'bg-violet-500' :
              resolvedAccent === 'rose' ? 'bg-rose-500' : 'bg-foreground'
        }`} />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300 ${accentStyles.icon}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-foreground/50 transition-colors group-hover:text-foreground/70">
                {title}
              </div>
              <RealtimePill realtime={realtime} />
            </div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {value}
            </div>
            {subtitle ? (
              <div className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground/50">
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>

        {trend ? (
          <div className="shrink-0">
            <TrendPill trend={trend} />
          </div>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30"
        aria-label={`${title}: ${value}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export const typography = {
  h1: "text-3xl font-semibold tracking-tight sm:text-4xl",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-xl font-medium",
  body: "text-base leading-relaxed",
  small: "text-sm text-muted-foreground",
  caption: "text-xs text-muted-foreground",
  label: "text-xs font-medium uppercase tracking-widest text-muted-foreground",
} as const;

export const spacing = {
  page: "px-4 py-8 sm:px-6 lg:px-8",
  section: "space-y-6",
  card: "p-6",
  stack: "space-y-4",
} as const;

export const dashboard = {
  hero: "text-3xl font-semibold tracking-tight sm:text-4xl",
  heroCard: "relative overflow-hidden rounded-2xl border bg-card p-6 shadow-sm lg:p-8",
  kpiGrid: "grid grid-cols-2 gap-4 lg:grid-cols-4",
  statCard: "rounded-xl border bg-card p-4 shadow-sm",
  contentMax: "mx-auto w-full max-w-6xl",
} as const;

export const workspace = {
  pageHero: "rounded-2xl border bg-card shadow-sm",
  pageHeroInner: "p-6 sm:p-8",
  statTile: "rounded-xl border bg-muted/20 px-4 py-3",
  sectionCard: "rounded-xl border bg-card shadow-sm",
  iconBox: "grid size-10 place-items-center rounded-lg border border-border bg-muted/30",
} as const;

export const shell = {
  sidebarWidth: "w-[260px]",
  topbarHeight: "h-14",
  sidebarHeader: "flex h-14 shrink-0 items-center border-b border-sidebar-border px-4",
  navItem:
    "relative flex h-9 items-center gap-2.5 rounded-lg px-3 text-[13px] font-medium transition-colors",
  navItemActive:
    "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_3px_0_0_0_var(--sidebar-primary)]",
  navGroup:
    "px-3 pt-5 pb-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/80 first:pt-2",
  navGroupDivider: "mx-3 border-t border-sidebar-border/50",
} as const;

export const semantic = {
  iconBoxPrimary: "flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary",
  iconBoxSuccess: "flex size-10 items-center justify-center rounded-lg bg-success/10 text-success",
  badgeSuccess: "bg-success/10 text-success border-success/20",
} as const;

import {
  BarChart3,
  Code2,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Network,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

export const SIDEBAR_SECTIONS: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/analytics", icon: TrendingUp },
      { label: "Goals", href: "/goals", icon: Target },
    ],
  },
  {
    id: "leetcode",
    label: "LeetCode",
    items: [
      { label: "Overview", href: "/leetcode", icon: Code2 },
      { label: "Progress", href: "/leetcode/progress", icon: BarChart3 },
      { label: "Suggestions", href: "/leetcode/suggestions", icon: Sparkles },
    ],
  },
  {
    id: "system-design",
    label: "System Design",
    items: [
      { label: "Today", href: "/system-design", icon: Network },
      { label: "Practice", href: "/system-design/practice", icon: Zap },
      { label: "Archive", href: "/system-design/archive", icon: ListChecks },
    ],
  },
  {
    id: "ai",
    label: "AI Coach",
    items: [
      { label: "Chat", href: "/chat", icon: MessageSquare },
      { label: "History", href: "/chat/history", icon: History },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/chat") {
    return pathname === "/chat" || pathname.startsWith("/chat?");
  }
  if (href === "/chat/history") {
    return pathname === "/chat/history";
  }
  if (href === "/system-design") {
    return (
      pathname === "/system-design" ||
      pathname === "/system-design/waiting" ||
      pathname.startsWith("/system-design/c/")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

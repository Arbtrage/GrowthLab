"use client";

import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/common/BrandMark";
import { SidebarUserFooter } from "@/components/layout/SidebarUserFooter";
import { shell } from "@/constants/design";
import { isNavItemActive, SIDEBAR_SECTIONS } from "@/lib/navigation/modules";
import { cn } from "@/lib/utils";
import Link from "next/link";

type AppSidebarProps = {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({
  userName,
  userEmail,
  avatarUrl,
  className,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        shell.sidebarWidth,
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
      <div className={shell.sidebarHeader}>
        <BrandMark href="/dashboard" showTagline={false} onClick={onNavigate} />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-3" aria-label="Navigation">
        {SIDEBAR_SECTIONS.map((section, index) => (
          <div key={section.id}>
            {index > 0 ? <div className={shell.navGroupDivider} /> : null}
            <div className={shell.navGroup}>{section.label}</div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const isActive = isNavItemActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      shell.navItem,
                      isActive
                        ? shell.navItemActive
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <SidebarUserFooter
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />
    </aside>
  );
}

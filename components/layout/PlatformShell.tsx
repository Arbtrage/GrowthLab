"use client";

import * as React from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { shell } from "@/constants/design";
import { cn } from "@/lib/utils";

type PlatformShellProps = {
  userName?: string | null;
  userEmail?: string | null;
  avatarUrl?: string | null;
  children: React.ReactNode;
  contentClassName?: string;
};

export function PlatformShell({
  userName,
  userEmail,
  avatarUrl,
  children,
  contentClassName,
}: PlatformShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex min-h-0 flex-1">
        <AppSidebar
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          className="hidden lg:flex"
        />

        {mobileNavOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
              aria-label="Close navigation"
              onClick={() => setMobileNavOpen(false)}
            />
            <AppSidebar
              userName={userName}
              userEmail={userEmail}
              avatarUrl={avatarUrl}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className={cn(
              shell.topbarHeight,
              "flex shrink-0 items-center gap-3 border-b bg-background/70 px-4 backdrop-blur-xl lg:hidden",
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <Menu className="size-4" />
            </Button>
            <Image src="/logo.svg" alt="" width={20} height={20} className="size-5 rounded-sm" />
            <span className="text-sm font-medium">GrowthLab</span>
          </header>

          <main className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-6", contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

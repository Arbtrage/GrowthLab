"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const THEMES = ["light", "dark", "system"] as const;
type ThemeOption = (typeof THEMES)[number];

const ICONS: Record<ThemeOption, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<ThemeOption, string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "System",
};

function subscribe() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const current = (THEMES.includes(theme as ThemeOption) ? theme : "dark") as ThemeOption;

  if (!mounted) {
    return null;
  }

  return (
    <>
      {THEMES.map((option) => {
        const Icon = ICONS[option];
        const isActive = current === option;

        return (
          <DropdownMenuItem
            key={option}
            className="cursor-pointer"
            onClick={() => setTheme(option)}
          >
            <Icon className="size-4" />
            {LABELS[option]}
            {isActive ? <Check className="ml-auto size-4 text-primary" /> : null}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

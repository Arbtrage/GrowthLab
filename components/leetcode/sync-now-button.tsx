"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { syncLeetCodeNow } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SyncNowButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await syncLeetCodeNow();
            router.refresh();
            toast.success("LeetCode stats synced");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Sync failed");
          }
        })
      }
    >
      <RefreshCw className={pending ? "mr-1.5 size-4 animate-spin" : "mr-1.5 size-4"} />
      Sync now
    </Button>
  );
}

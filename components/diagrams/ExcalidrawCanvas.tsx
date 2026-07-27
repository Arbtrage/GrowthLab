"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => <Skeleton className="h-[420px] w-full rounded-lg" />,
  },
);

interface ExcalidrawCanvasProps {
  initialData?: unknown;
  onChange: (state: unknown) => void;
  readOnly?: boolean;
}

export function ExcalidrawCanvas({
  initialData,
  onChange,
  readOnly,
}: ExcalidrawCanvasProps) {
  return (
    <div className="min-h-[320px] h-[min(420px,50vh)] overflow-hidden rounded-lg border sm:min-h-[420px]">
      <Excalidraw
        initialData={initialData as never}
        viewModeEnabled={readOnly}
        zenModeEnabled={false}
        gridModeEnabled
        onChange={(elements, appState, files) => {
          if (!readOnly) {
            onChange({ elements, appState, files });
          }
        }}
      />
    </div>
  );
}

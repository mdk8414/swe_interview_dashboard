"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, type Ref } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false, loading: () => <div className="p-6 text-sm text-zinc-500">Loading canvas…</div> }
);

// Subset of the Excalidraw API we actually call.
type ExcalidrawAPI = {
  getSceneElements: () => readonly unknown[];
  getAppState: () => Record<string, unknown>;
  getFiles: () => Record<string, unknown>;
};

export type ExcalidrawCanvasHandle = {
  /** Export the current scene as a base64 PNG (no data: prefix). Returns null if nothing has been drawn. */
  exportPng: () => Promise<string | null>;
};

type Props = {
  diagramId: string;
  initialSceneJson: string;
  onSave: (diagramId: string, sceneJson: string) => Promise<void>;
  ref?: Ref<ExcalidrawCanvasHandle>;
};

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let h: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (h) clearTimeout(h);
    h = setTimeout(() => fn(...args), ms);
  }) as T;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Strip the "data:image/png;base64," prefix.
      const idx = result.indexOf(",");
      resolve(idx === -1 ? result : result.slice(idx + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export default function ExcalidrawCanvas({
  diagramId,
  initialSceneJson,
  onSave,
  ref,
}: Props) {
  const initial = (() => {
    try {
      const parsed = JSON.parse(initialSceneJson);
      return {
        elements: parsed.elements ?? [],
        appState: { ...(parsed.appState ?? {}), collaborators: new Map() },
        files: parsed.files ?? {},
      };
    } catch {
      return { elements: [], appState: { collaborators: new Map() }, files: {} };
    }
  })();

  const lastSerialized = useRef<string>("");
  const apiRef = useRef<ExcalidrawAPI | null>(null);
  const debouncedSave = useRef(
    debounce((id: string, json: string) => {
      void onSave(id, json);
    }, 800)
  ).current;

  const handleChange = useCallback(
    (elements: readonly unknown[], appState: unknown, files: unknown) => {
      const scene = {
        elements,
        appState,
        files,
      };
      const json = JSON.stringify(scene, (_k, v) => (v instanceof Map ? undefined : v));
      if (json === lastSerialized.current) return;
      lastSerialized.current = json;
      debouncedSave(diagramId, json);
    },
    [diagramId, debouncedSave]
  );

  useImperativeHandle(
    ref,
    () => ({
      exportPng: async () => {
        const api = apiRef.current;
        if (!api) return null;
        const elements = api.getSceneElements();
        if (!elements || elements.length === 0) return null;
        try {
          // Lazy-import to keep this off the SSR path.
          const { exportToBlob } = await import("@excalidraw/excalidraw");
          const blob = await exportToBlob({
            elements: elements as never,
            files: api.getFiles() as never,
            mimeType: "image/png",
            appState: { exportWithDarkMode: false } as never,
          });
          if (!blob) return null;
          return await blobToBase64(blob);
        } catch (err) {
          console.warn("Excalidraw exportPng failed:", err);
          return null;
        }
      },
    }),
    []
  );

  // ensure last edits are flushed when navigating away
  useEffect(() => {
    return () => {
      if (lastSerialized.current) void onSave(diagramId, lastSerialized.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagramId]);

  return (
    <div className="w-full h-full min-h-[600px]">
      <Excalidraw
        initialData={initial}
        onChange={handleChange}
        excalidrawAPI={(api: ExcalidrawAPI) => {
          apiRef.current = api;
        }}
      />
    </div>
  );
}

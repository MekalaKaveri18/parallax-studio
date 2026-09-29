"use client";

import { useEffect } from "react";
import { provider } from "@/lib/provider";
import { useStore } from "@/lib/store";
import { AssetViewer } from "./AssetViewer";
import { toast, ToastHost } from "./Toast";

/** Jobs currently waiting on the provider, so each is finalized exactly once. */
const finalizing = new Set<string>();

function useJobRunner() {
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    const step = () => {
      const { tick, completeJob, failJob } = useStore.getState();
      for (const job of tick(Date.now())) {
        if (finalizing.has(job.id)) continue;
        finalizing.add(job.id);
        provider
          .finalize(job.params, job.id)
          .then((urls) => {
            completeJob(job.id, urls);
            const title =
              job.params.kind === "image"
                ? `${urls.length} image${urls.length > 1 ? "s" : ""} ready`
                : "Your video is ready";
            toast({ tone: "success", title, action: { label: "View", href: `/library?open=${job.id}` } });
          })
          .catch((e: unknown) => failJob(job.id, e instanceof Error ? e.message : "Generation failed"))
          .finally(() => finalizing.delete(job.id));
      }
    };
    step();
    const id = setInterval(step, 200);
    return () => clearInterval(id);
  }, [hydrated]);
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  useJobRunner();

  return (
    <>
      {children}
      <AssetViewer />
      <ToastHost />
    </>
  );
}

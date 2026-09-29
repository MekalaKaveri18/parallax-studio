export type AssetKind = "image" | "video";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export type JobStatus = "queued" | "running" | "done" | "failed";

export interface ImageParams {
  kind: "image";
  prompt: string;
  styleId: string;
  aspect: AspectRatio;
  count: number;
}

export interface VideoParams {
  kind: "video";
  prompt: string;
  sourceAssetId: string | null;
  /** Source still: a library asset URL or an uploaded data URL. */
  sourceUrl: string;
  aspect: AspectRatio;
  motionId: string;
  duration: number;
  /** Motion strength multiplier, 0.5–1.5. */
  intensity: number;
}

export type JobParams = ImageParams | VideoParams;

export interface Job {
  id: string;
  params: JobParams;
  status: JobStatus;
  /** 0–1 */
  progress: number;
  cost: number;
  createdAt: number;
  startedAt?: number;
  /** Simulated generation time in ms. */
  durationMs: number;
  assetIds: string[];
  error?: string;
}

export interface Asset {
  id: string;
  jobId: string;
  kind: AssetKind;
  /** For images: the image. For videos: the source still the motion is rendered over. */
  url: string;
  aspect: AspectRatio;
  prompt: string;
  styleId?: string;
  motionId?: string;
  duration?: number;
  intensity?: number;
  sourceAssetId?: string | null;
  createdAt: number;
  favorite: boolean;
  uploaded?: boolean;
}

export type PlanId = "free" | "creator" | "studio";

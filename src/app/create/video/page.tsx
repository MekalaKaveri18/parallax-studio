import { Suspense } from "react";
import { VideoStudio } from "./VideoStudio";

export const metadata = { title: "Create video — Parallax" };

export default function Page() {
  return (
    <Suspense>
      <VideoStudio />
    </Suspense>
  );
}

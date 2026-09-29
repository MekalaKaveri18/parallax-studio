import { Suspense } from "react";
import { ImageStudio } from "./ImageStudio";

export const metadata = { title: "Create image — Parallax" };

export default function Page() {
  return (
    <Suspense>
      <ImageStudio />
    </Suspense>
  );
}

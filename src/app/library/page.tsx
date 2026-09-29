import { Suspense } from "react";
import { Library } from "./Library";

export const metadata = { title: "Library — Parallax" };

export default function Page() {
  return (
    <Suspense>
      <Library />
    </Suspense>
  );
}

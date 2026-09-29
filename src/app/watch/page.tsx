import { Suspense } from "react";
import { Watch } from "./Watch";

export const metadata = { title: "Shot preview — Parallax" };

export default function Page() {
  return (
    <Suspense>
      <Watch />
    </Suspense>
  );
}

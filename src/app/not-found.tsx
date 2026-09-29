import Link from "next/link";
import { MotionMedia } from "@/components/MotionMedia";
import { seededImage } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
      <div className="w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        <MotionMedia src={seededImage("lost-404", 16, 9, 1200)} alt="" motionId="dolly-out" duration={6} className="aspect-video" />
      </div>
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">This shot didn&apos;t make the final cut</h1>
      <p className="mt-2 text-sm text-white/50">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-ink hover:bg-white">
          Back to Explore
        </Link>
        <Link href="/create/image" className="rounded-full bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
          Create an image
        </Link>
      </div>
    </div>
  );
}

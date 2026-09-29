import Link from "next/link";
import { LogoMark } from "./LogoMark";

const COLUMNS = [
  {
    title: "Create",
    links: [
      { href: "/create/image", label: "Image generator" },
      { href: "/create/video", label: "Image to video" },
      { href: "/create/video?motion=crash-zoom", label: "Crash Zoom" },
      { href: "/create/video?motion=orbit-left", label: "Orbit" },
    ],
  },
  {
    title: "Discover",
    links: [
      { href: "/", label: "Explore feed" },
      { href: "/library", label: "Your library" },
      { href: "/pricing", label: "Pricing" },
      { href: "/mcp", label: "Claude MCP connector" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-up", label: "Create account" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/pricing", label: "Plans & credits" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-ink-950">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href="/" className="flex items-center gap-2" aria-label="Parallax home">
            <LogoMark size={28} />
            <span className="text-[17px] font-semibold tracking-[-0.03em]">parallax</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/50">
            Generate a frame, then direct the camera. Cinematic motion for any image, with a free live preview before you spend a
            credit.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-xs font-medium uppercase tracking-wider text-white/40">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-white/35 sm:px-6">
          <span>© 2026 Parallax. A Higgsfield-inspired studio built in 24 hours.</span>
          <span>Generation is simulated in this demo. No payments are taken.</span>
        </div>
      </div>
    </footer>
  );
}

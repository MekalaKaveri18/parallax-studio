"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { SIGNUP_BONUS } from "@/lib/presets";
import { useStore } from "@/lib/store";
import { seededImage } from "@/lib/utils";
import { Logo } from "./Nav";
import { MotionMedia } from "./MotionMedia";

type Mode = "sign-in" | "sign-up";

/** Only allow same-site relative redirects. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/create/image";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const guestAssets = useStore((s) => (s.owner ? 0 : s.assets.length));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUp = mode === "sign-up";
  const other = isUp ? "/sign-in" : "/sign-up";
  const otherHref = next === "/create/image" ? other : `${other}?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isUp && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    setBusy(true);
    const res = isUp
      ? await signUp.email({ name: name.trim() || email.split("@")[0], email: email.trim(), password })
      : await signIn.email({ email: email.trim(), password });
    setBusy(false);
    if (res.error) {
      setError(
        res.error.status === 401 || res.error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don't match."
          : res.error.code === "USER_ALREADY_EXISTS" || res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
            ? "An account with this email already exists. Try signing in."
            : (res.error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="grid min-h-[calc(100dvh-3.5rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate>
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{isUp ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1.5 text-sm text-white/50">
            {isUp
              ? `Free forever. Get +${SIGNUP_BONUS} bonus credits and keep your work on every device.`
              : "Sign in to pick up where you left off."}
          </p>

          {guestAssets > 0 && (
            <p className="mt-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-white/80">
              The {guestAssets} item{guestAssets > 1 ? "s" : ""} you made as a guest will be saved to your account.
            </p>
          )}

          <div className="mt-6 space-y-3">
            {isUp && (
              <Field label="Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  className="input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="input"
                autoFocus
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isUp ? "new-password" : "current-password"}
                  placeholder={isUp ? "At least 8 characters" : "Your password"}
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 hover:text-white"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-amber-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink transition hover:bg-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {isUp ? "Create account" : "Sign in"}
          </button>

          <p className="mt-6 text-center text-sm text-white/50">
            {isUp ? "Already have an account?" : "New to Parallax?"}{" "}
            <Link href={otherHref} className="text-white hover:underline">
              {isUp ? "Sign in" : "Create one"}
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-white/30">
            Or{" "}
            <Link href="/" className="underline hover:text-white/60">
              keep exploring as a guest
            </Link>
          </p>
        </form>
      </div>

      <div className="relative hidden overflow-hidden border-l border-white/5 lg:block">
        <div className="absolute inset-0">
          <MotionMedia
            src={seededImage(isUp ? "auth-signup" : "auth-signin", 3, 4, 1400)}
            alt=""
            motionId="dolly-in"
            duration={12}
            intensity={0.7}
            loading="eager"
            className="size-full"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-2xl font-semibold tracking-tight">Generate a frame. Direct the camera.</p>
          <p className="mt-2 text-sm text-white/60">18 cinematic moves, free live preview, and your library everywhere you sign in.</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/60">{label}</span>
      {children}
    </label>
  );
}

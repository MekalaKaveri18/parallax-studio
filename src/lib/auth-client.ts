"use client";

import { createAuthClient } from "better-auth/react";

/** Talks to /api/auth on the current origin. */
export const authClient = createAuthClient();

export const { useSession, signIn, signUp, signOut } = authClient;

import { toNextJsHandler } from "better-auth/next-js";
import { auth, ensureSchema } from "@/lib/server/auth";

const handler = toNextJsHandler(auth);

export async function GET(req: Request) {
  await ensureSchema();
  return handler.GET(req);
}

export async function POST(req: Request) {
  await ensureSchema();
  return handler.POST(req);
}

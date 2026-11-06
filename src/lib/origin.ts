import "server-only";
import { headers } from "next/headers";

// The public address this request came in on ("https://voxis-eight.vercel.app"), for building links and QR codes.
export async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

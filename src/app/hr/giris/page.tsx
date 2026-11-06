import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/hr/LoginForm";
import { isHr } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "HR girişi — Voxis", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isHr()) redirect("/hr/vakansiyalar");
  return (
    <main className="grid min-h-dvh place-items-center bg-surface px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8">
        <p className="mb-6 flex items-center gap-2 font-semibold"><span aria-hidden className="h-2 w-3.5 rounded-full bg-primary" />Voxis</p>
        <h1 className="mb-6 text-2xl font-semibold">HR panelinə giriş</h1>
        <LoginForm />
      </div>
    </main>
  );
}

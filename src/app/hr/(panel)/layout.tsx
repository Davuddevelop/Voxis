import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/hr/ClientButtons";
import { isHr } from "@/lib/hr-auth";

export const metadata: Metadata = { title: "HR paneli — Voxis", robots: { index: false, follow: false } };

// Every page inside this group requires an HR session; the login page lives outside it on purpose.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!(await isHr())) redirect("/hr/giris");
  return (
    <div className="min-h-dvh bg-page">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link href="/hr/vakansiyalar" className="flex items-center gap-2 font-semibold"><Logo size={28} decorative />Voxis</Link>
            <nav aria-label="Əsas menyu"><Link href="/hr/vakansiyalar" data-testid="S-03-B1" className="rounded-lg bg-primary-light px-3 py-1.5 text-sm font-medium text-primary">Vakansiyalar</Link></nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { LocaleSwitch } from "@/components/LocaleSwitch";
import { getMessages } from "@/lib/locale";
import "./globals.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const { m } = await getMessages();
  return { title: m.siteName, description: m.siteDescription };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, m } = await getMessages();

  return (
    <html lang={locale === "en" ? "en" : "zh-CN"}>
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link href="/videos" className="font-semibold text-slate-800">
              {m.siteName}
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <Link href="/videos" className="text-slate-600 hover:text-slate-900">
                {m.nav.videos}
              </Link>
              <Link href="/analysis" className="text-slate-600 hover:text-slate-900">
                {m.nav.analysis}
              </Link>
              <Link href="/model" className="text-slate-600 hover:text-slate-900">
                {m.nav.model}
              </Link>
              <Link href="/dictionaries" className="text-slate-600 hover:text-slate-900">
                {m.nav.dictionaries}
              </Link>
              <Link href="/collections" className="text-slate-600 hover:text-slate-900">
                {m.nav.collection}
              </Link>
              <Link href="/model-config" className="text-slate-600 hover:text-slate-900">
                {m.nav.modelConfig}
              </Link>
              <Suspense fallback={null}>
                <LocaleSwitch locale={locale} />
              </Suspense>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}

"use client";

import { usePathname, useSearchParams } from "next/navigation";

import type { Locale } from "@/lib/i18n";
import { messages } from "@/lib/i18n";

export function LocaleSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname() || "/videos";
  const search = useSearchParams().toString();
  const next = search ? `${pathname}?${search}` : pathname;
  const label = messages[locale].localeName;

  function href(lang: Locale) {
    return `/api/locale?lang=${lang}&next=${encodeURIComponent(next)}`;
  }

  return (
    <span className="ml-1 inline-flex items-center gap-2 border-l border-slate-200 pl-4">
      <a
        href={href("zh")}
        hrefLang="zh-CN"
        className={locale === "zh" ? "font-semibold text-slate-900" : "text-slate-500 hover:text-slate-900"}
      >
        {label.zh}
      </a>
      <a
        href={href("en")}
        hrefLang="en"
        className={locale === "en" ? "font-semibold text-slate-900" : "text-slate-500 hover:text-slate-900"}
      >
        {label.en}
      </a>
    </span>
  );
}

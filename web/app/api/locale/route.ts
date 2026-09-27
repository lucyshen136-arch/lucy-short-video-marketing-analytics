import { NextResponse } from "next/server";

import { isLocale } from "@/lib/i18n";

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/videos";
  }
  return value;
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("lang");
  const lang = isLocale(requested) ? requested : "zh";
  const response = NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin));
  response.cookies.set("locale", lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}

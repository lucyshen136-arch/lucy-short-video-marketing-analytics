import { cookies } from "next/headers";

import { isLocale, messages, type Locale } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return isLocale(value) ? value : "zh";
}

export async function getMessages() {
  const locale = await getLocale();
  return { locale, m: messages[locale] };
}

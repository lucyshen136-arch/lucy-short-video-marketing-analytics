import NewVideoClient from "@/app/videos/new/NewVideoClient";
import { getLocale } from "@/lib/locale";

export default async function NewVideoPage() {
  const locale = await getLocale();
  return <NewVideoClient locale={locale} />;
}

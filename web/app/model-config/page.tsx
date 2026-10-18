import ModelConfigBoard from "@/components/ModelConfigBoard";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function ModelConfigPage() {
  const locale = await getLocale();
  return <ModelConfigBoard locale={locale} />;
}

import ModelStudio from "@/components/ModelStudio";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function ModelPage() {
  const locale = await getLocale();
  return <ModelStudio locale={locale} />;
}

import CollectionBoard from "@/components/CollectionBoard";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const locale = await getLocale();
  return <CollectionBoard locale={locale} />;
}

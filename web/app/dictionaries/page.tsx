import DictionarySetList from "@/components/DictionarySetList";
import { getLocale } from "@/lib/locale";

export default async function DictionariesPage() {
  const locale = await getLocale();
  return <DictionarySetList locale={locale} />;
}

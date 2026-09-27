import DictionarySetEditor from "@/components/DictionarySetEditor";
import { getLocale } from "@/lib/locale";

export default async function DictionarySetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();
  return <DictionarySetEditor slug={slug} locale={locale} />;
}

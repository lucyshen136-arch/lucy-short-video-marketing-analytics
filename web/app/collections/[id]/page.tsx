import CollectionDetail from "@/components/CollectionDetail";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  return <CollectionDetail locale={locale} jobId={Number(id)} />;
}

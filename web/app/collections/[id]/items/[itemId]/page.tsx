import { Suspense } from "react";

import CollectionItemEditor from "@/components/CollectionItemEditor";
import { getLocale } from "@/lib/locale";

export const dynamic = "force-dynamic";

export default async function CollectionItemPage({ params }: { params: Promise<{ id: string; itemId: string }> }) {
  const { id, itemId } = await params;
  const locale = await getLocale();
  return (
    <Suspense fallback={null}>
      <CollectionItemEditor locale={locale} jobId={Number(id)} itemId={Number(itemId)} />
    </Suspense>
  );
}

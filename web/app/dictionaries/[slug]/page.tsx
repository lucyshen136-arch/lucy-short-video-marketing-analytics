import DictionarySetEditor from "@/components/DictionarySetEditor";

export default async function DictionarySetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <DictionarySetEditor slug={slug} />;
}

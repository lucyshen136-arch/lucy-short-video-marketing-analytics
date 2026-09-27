import EditVideoClient from "@/app/videos/[videoId]/edit/EditVideoClient";
import { getLocale } from "@/lib/locale";

export default async function EditVideoPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params;
  const locale = await getLocale();
  return <EditVideoClient locale={locale} videoId={videoId} />;
}

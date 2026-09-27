"use client";

import { useRouter } from "next/navigation";

import VideoForm from "@/components/VideoForm";
import { createVideo } from "@/lib/api";
import { messages, type Locale } from "@/lib/i18n";

export default function NewVideoClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const f = messages[locale].form;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{f.addTitle}</h1>
      <VideoForm
        mode="create"
        locale={locale}
        onSubmit={async (payload) => {
          const row = await createVideo(payload as Parameters<typeof createVideo>[0]);
          router.push(`/videos/${row.video_id}`);
          router.refresh();
        }}
      />
    </div>
  );
}

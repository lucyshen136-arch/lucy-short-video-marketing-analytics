"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import VideoForm from "@/components/VideoForm";
import { deleteVideo, getVideo, updateVideo } from "@/lib/api";
import { messages, type Locale } from "@/lib/i18n";
import type { VideoRecord } from "@/lib/types";

export default function EditVideoClient({ locale, videoId }: { locale: Locale; videoId: string }) {
  const router = useRouter();
  const f = messages[locale].form;
  const [initial, setInitial] = useState<VideoRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVideo(videoId)
      .then(setInitial)
      .catch((e: Error) => setError(e.message));
  }, [videoId]);

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!initial) {
    return <p className="text-slate-500">{f.loading}</p>;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{f.editTitle(videoId)}</h1>
      <VideoForm
        mode="edit"
        locale={locale}
        initial={initial}
        onSubmit={async (payload) => {
          await updateVideo(videoId, payload as Parameters<typeof updateVideo>[1]);
          router.push(`/videos/${videoId}`);
          router.refresh();
        }}
        onDelete={async () => {
          await deleteVideo(videoId);
          router.push("/videos");
          router.refresh();
        }}
      />
    </div>
  );
}

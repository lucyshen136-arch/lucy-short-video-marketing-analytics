"use client";

import { useRouter } from "next/navigation";

import VideoForm from "@/components/VideoForm";
import { createVideo } from "@/lib/api";

export default function NewVideoPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">添加视频</h1>
      <VideoForm
        mode="create"
        onSubmit={async (payload) => {
          const row = await createVideo(
            payload as Parameters<typeof createVideo>[0],
          );
          router.push(`/videos/${row.video_id}`);
          router.refresh();
        }}
      />
    </div>
  );
}

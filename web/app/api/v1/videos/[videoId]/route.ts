import { deleteVideoDb, getVideoDb, updateVideoDb } from "@/lib/data/videos";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ videoId: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { videoId } = await params;
    return jsonOk(await getVideoDb(videoId));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { videoId } = await params;
    const payload = await readJson<Record<string, unknown>>(request);
    return jsonOk(await updateVideoDb(videoId, payload));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { videoId } = await params;
    await deleteVideoDb(videoId);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

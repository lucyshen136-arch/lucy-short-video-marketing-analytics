import { createVideoDb, listVideosDb } from "@/lib/data/videos";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    return jsonOk(await listVideosDb(page, pageSize));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<Record<string, unknown>>(request);
    return jsonOk(await createVideoDb(payload), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

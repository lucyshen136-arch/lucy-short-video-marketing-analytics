import { createLayerDb } from "@/lib/data/video-model";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name?: string }>(request);
    return jsonOk(await createLayerDb(body.name ?? ""), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

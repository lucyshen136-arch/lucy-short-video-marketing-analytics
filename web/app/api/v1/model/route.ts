import { getVideoModelDb } from "@/lib/data/video-model";
import { handleApiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await getVideoModelDb());
  } catch (error) {
    return handleApiError(error);
  }
}

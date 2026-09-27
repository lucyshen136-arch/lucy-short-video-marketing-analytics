import { getLabelDictionaryDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ kind: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { kind } = await params;
    if (kind !== "content" && kind !== "viewer") {
      return jsonError("Not found", 404);
    }
    return jsonOk(await getLabelDictionaryDb(kind));
  } catch (error) {
    return handleApiError(error);
  }
}

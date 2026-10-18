import { importCollectionItemsDb } from "@/lib/data/collections";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await readJson<{ ids?: number[] }>(request);
    const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((id) => Number.isFinite(id)) : [];
    return jsonOk(await importCollectionItemsDb(ids));
  } catch (error) {
    return handleApiError(error);
  }
}

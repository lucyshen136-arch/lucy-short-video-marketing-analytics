import { importProjectDictionariesDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return jsonOk(await importProjectDictionariesDb());
  } catch (error) {
    return handleApiError(error);
  }
}

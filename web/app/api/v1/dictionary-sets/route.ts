import { createDictionarySetDb, listDictionarySetsDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listDictionarySetsDb());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readJson<{
      slug: string;
      name: string;
      description?: string;
      version?: string;
      source_doc?: string;
      scope?: string;
    }>(request);
    return jsonOk(await createDictionarySetDb(payload), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

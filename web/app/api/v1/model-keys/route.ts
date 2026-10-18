import { createModelKeyDb, listModelKeysDb } from "@/lib/data/model-keys";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listModelKeysDb());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{
      name?: string;
      base_url?: string;
      model_name?: string;
      api_key?: string;
      priority?: number;
      timeout_seconds?: number;
    }>(request);
    return jsonOk(
      await createModelKeyDb({
        name: body.name ?? "",
        base_url: body.base_url ?? "",
        model_name: body.model_name ?? "",
        api_key: body.api_key ?? "",
        priority: body.priority,
        timeout_seconds: body.timeout_seconds,
      }),
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

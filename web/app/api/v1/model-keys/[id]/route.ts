import { deleteModelKeyDb, updateModelKeyDb } from "@/lib/data/model-keys";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<{
      name?: string;
      base_url?: string;
      model_name?: string;
      api_key?: string;
      priority?: number;
      timeout_seconds?: number;
      enabled?: boolean;
    }>(request);
    return jsonOk(await updateModelKeyDb(Number(id), body));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return jsonOk(await deleteModelKeyDb(Number(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

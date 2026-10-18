import { deleteFieldDb, updateFieldDb } from "@/lib/data/video-model";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<{
      label?: string;
      field_kind?: string;
      required?: boolean;
      sort_order?: number;
      dictionary_slug?: string | null;
    }>(request);
    await updateFieldDb(Number(id), body);
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteFieldDb(Number(id));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

import { deleteLayerDb, renameLayerDb } from "@/lib/data/video-model";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<{ name?: string }>(request);
    await renameLayerDb(Number(id), body.name ?? "");
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteLayerDb(Number(id));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

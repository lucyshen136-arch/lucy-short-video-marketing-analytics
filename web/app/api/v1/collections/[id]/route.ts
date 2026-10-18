import { deleteCollectionJobDb, getCollectionDetailDb } from "@/lib/data/collections";
import { handleApiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return jsonOk(await getCollectionDetailDb(Number(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteCollectionJobDb(Number(id));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

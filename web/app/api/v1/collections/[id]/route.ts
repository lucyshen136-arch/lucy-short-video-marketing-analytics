import { deleteCollectionJobDb, getCollectionDetailDb, updateCollectionJobDb } from "@/lib/data/collections";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

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

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<{ name?: string; site_url?: string; keyword?: string; collect_count?: number }>(request);
    return jsonOk(
      await updateCollectionJobDb(Number(id), {
        name: body.name ?? "",
        site_url: body.site_url ?? "",
        keyword: body.keyword,
        collect_count: body.collect_count,
      }),
    );
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

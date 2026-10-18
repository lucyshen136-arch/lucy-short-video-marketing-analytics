import { deleteCollectionItemDb, getCollectionItemDb, updateCollectionItemDb } from "@/lib/data/collections";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";
import type { CollectedMeta } from "@/lib/crawl";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return jsonOk(await getCollectionItemDb(Number(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<Partial<CollectedMeta>>(request);
    await updateCollectionItemDb(Number(id), body);
    return jsonOk(await getCollectionItemDb(Number(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteCollectionItemDb(Number(id));
    return jsonOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

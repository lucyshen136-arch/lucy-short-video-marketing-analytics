import { deleteItemDb, updateItemDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ itemId: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { itemId } = await params;
    const payload = await readJson<{
      code: string;
      label_zh: string;
      definition?: string | null;
      sort_order: number;
    }>(request);
    return jsonOk(await updateItemDb(Number(itemId), payload));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { itemId } = await params;
    await deleteItemDb(Number(itemId));
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

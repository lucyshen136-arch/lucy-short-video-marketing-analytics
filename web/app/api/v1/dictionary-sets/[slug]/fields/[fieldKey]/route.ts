import { deleteFieldDb, updateFieldDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string; fieldKey: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { slug, fieldKey } = await params;
    const payload = await readJson<{
      label_zh: string;
      field_kind?: string;
      question?: string | null;
    }>(request);
    return jsonOk(await updateFieldDb(slug, fieldKey, payload));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { slug, fieldKey } = await params;
    await deleteFieldDb(slug, fieldKey);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

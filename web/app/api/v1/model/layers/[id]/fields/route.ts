import { createFieldDb } from "@/lib/data/video-model";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await readJson<{
      field_key?: string;
      label?: string;
      field_kind?: string;
      required?: boolean;
      dictionary_slug?: string | null;
    }>(request);
    await createFieldDb(Number(id), {
      field_key: body.field_key ?? "",
      label: body.label ?? "",
      field_kind: body.field_kind ?? "text",
      required: body.required,
      dictionary_slug: body.dictionary_slug,
    });
    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

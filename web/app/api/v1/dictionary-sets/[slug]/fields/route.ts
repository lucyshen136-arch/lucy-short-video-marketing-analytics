import { createFieldDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const payload = await readJson<{
      field_key: string;
      label_zh: string;
      field_kind?: string;
      question?: string;
    }>(request);
    return jsonOk(await createFieldDb(slug, payload), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

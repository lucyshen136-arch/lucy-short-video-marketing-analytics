import { deleteDictionarySetDb, getDictionarySetDb, updateDictionarySetDb } from "@/lib/data/dictionaries";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    return jsonOk(await getDictionarySetDb(slug));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const payload = await readJson<{
      name: string;
      description?: string | null;
      version?: string | null;
      source_doc?: string | null;
      scope?: string | null;
    }>(request);
    return jsonOk(await updateDictionarySetDb(slug, payload));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    await deleteDictionarySetDb(slug);
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

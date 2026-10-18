import { testModelKeyDb } from "@/lib/data/model-keys";
import { handleApiError } from "@/lib/api-error";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return jsonOk(await testModelKeyDb(Number(id)));
  } catch (error) {
    return handleApiError(error);
  }
}

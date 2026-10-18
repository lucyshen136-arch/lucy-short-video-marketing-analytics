import { createCollectionJobDb, listCollectionJobsDb } from "@/lib/data/collections";
import { handleApiError } from "@/lib/api-error";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return jsonOk(await listCollectionJobsDb());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson<{ name?: string; site_url?: string; keyword?: string; collect_count?: number }>(request);
    return jsonOk(
      await createCollectionJobDb({
        name: body.name ?? "",
        site_url: body.site_url ?? "",
        keyword: body.keyword,
        collect_count: body.collect_count,
      }),
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}

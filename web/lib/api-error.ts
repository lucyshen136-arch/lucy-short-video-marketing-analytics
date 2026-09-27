import { HttpError } from "@/lib/data/videos";
import { jsonError } from "@/lib/http";

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return jsonError(error.message, error.status);
  }
  const message = error instanceof Error ? error.message : "Internal error";
  if (message.includes("DATABASE_URL")) {
    return jsonError(message, 500);
  }
  console.error(error);
  return jsonError("Internal error", 500);
}

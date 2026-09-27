import { NextResponse } from "next/server";

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

export function jsonError(detail: string, status: number) {
  return NextResponse.json({ detail }, { status });
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

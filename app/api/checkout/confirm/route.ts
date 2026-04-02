import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  return NextResponse.redirect(new URL(`/dashboard?order=${orderId ?? ""}`, request.url));
}

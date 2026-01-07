import { NextResponse } from "next/server";

export async function GET(request: Request) {
	return NextResponse.json({ status: "OK" });
}

export async function POST(request: Request) {
	return NextResponse.json({ status: "OK" });
}

// Keeping other methods to satisfy Any catch-all if needed, but GET/POST is enough to test.

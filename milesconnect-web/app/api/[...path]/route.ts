import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getBackendBaseUrl() {
	return (
		process.env.BACKEND_URL ??
		process.env.NEXT_PUBLIC_BACKEND_URL ??
		process.env.API_BASE_URL ??
		"http://localhost:3001"
	);
}

async function proxy(req: NextRequest, params: { path: string[] }) {
	const baseUrl = getBackendBaseUrl().replace(/\/$/, "");
	const target = `${baseUrl}/api/${params.path.join("/")}${req.nextUrl.search}`;

	const headers = new Headers(req.headers);
	headers.delete("host");
	headers.delete("connection");

	const method = req.method.toUpperCase();
	const hasBody = !["GET", "HEAD"].includes(method);

	const res = await fetch(target, {
		method,
		headers,
		body: hasBody ? await req.arrayBuffer() : undefined,
		redirect: "manual",
	});

	const resHeaders = new Headers(res.headers);
	// Avoid leaking hop-by-hop headers
	resHeaders.delete("transfer-encoding");

	return new NextResponse(res.body, {
		status: res.status,
		headers: resHeaders,
	});
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
	return proxy(req, await ctx.params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
	return proxy(req, await ctx.params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
	return proxy(req, await ctx.params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
	return proxy(req, await ctx.params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
	return proxy(req, await ctx.params);
}

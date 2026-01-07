export type ApiClientConfig = {
	/**
	 * Base URL for backend services.
	 *
	 * Recommended: set `NEXT_PUBLIC_BACKEND_URL` for browser usage.
	 * If omitted, falls back to same-origin requests.
	 */
	baseUrl?: string;
	/** Default headers applied to every request. */
	defaultHeaders?: HeadersInit;
	/**
	 * Hook for future authentication headers.
	 *
	 * Example (later): return { Authorization: `Bearer ${token}` }.
	 */
	getAuthHeaders?: () => HeadersInit | Promise<HeadersInit>;
};

export type QueryParams = Record<
	string,
	string | number | boolean | null | undefined
>;

export type ApiRequestOptions<TBody = unknown> = {
	method?: string;
	/** Path relative to baseUrl, e.g. `/v1/shipments` */
	path: string;
	query?: QueryParams;
	headers?: HeadersInit;
	body?: TBody;
	/** Pass-through fetch options (e.g. `cache`, `signal`). */
	init?: RequestInit & { next?: unknown };
};

export class ApiError<TErrorBody = unknown> extends Error {
	readonly status: number | null;
	readonly url: string;
	readonly errorBody?: TErrorBody;

	constructor(params: {
		message: string;
		status: number | null;
		url: string;
		errorBody?: TErrorBody;
	}) {
		super(params.message);
		this.name = "ApiError";
		this.status = params.status;
		this.url = params.url;
		this.errorBody = params.errorBody;
	}
}

function extractErrorMessage(errorBody: unknown, fallback: string) {
	if (!errorBody) return fallback;
	if (typeof errorBody === "string" && errorBody.trim()) return errorBody;
	if (typeof errorBody === "object") {
		const anyBody = errorBody as Record<string, unknown>;
		const message = anyBody.message;
		if (typeof message === "string" && message.trim()) return message;
		const err = anyBody.error;
		if (typeof err === "object" && err) {
			const anyErr = err as Record<string, unknown>;
			const nested = anyErr.message;
			if (typeof nested === "string" && nested.trim()) return nested;
		}
	}
	return fallback;
}

function normalizeBaseUrl(baseUrl: string) {
	return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
}

function normalizePath(path: string) {
	if (!path) return "/";
	return path.startsWith("/") ? path : `/${path}`;
}

function buildUrl(baseUrl: string | undefined, path: string, query?: QueryParams) {
	const normalizedPath = normalizePath(path);

	let url = baseUrl ? `${normalizeBaseUrl(baseUrl)}${normalizedPath}` : normalizedPath;

	if (query && Object.keys(query).length > 0) {
		const sp = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) {
			if (value === undefined || value === null) continue;
			sp.set(key, String(value));
		}
		const qs = sp.toString();
		if (qs) url += `?${qs}`;
	}

	return url;
}

function isFormData(body: unknown): body is FormData {
	return typeof FormData !== "undefined" && body instanceof FormData;
}

function isBlob(body: unknown): body is Blob {
	return typeof Blob !== "undefined" && body instanceof Blob;
}

async function readResponseBody(res: Response): Promise<unknown> {
	if (res.status === 204) return undefined;
	const contentType = res.headers.get("content-type") ?? "";
	if (contentType.includes("application/json")) {
		try {
			return await res.json();
		} catch {
			return undefined;
		}
	}
	try {
		return await res.text();
	} catch {
		return undefined;
	}
}

function mergeHeaders(...headers: Array<HeadersInit | undefined>): Headers {
	const merged = new Headers();
	for (const h of headers) {
		if (!h) continue;
		new Headers(h).forEach((value, key) => merged.set(key, value));
	}
	return merged;
}

export function createApiClient(config: ApiClientConfig = {}) {
	const baseUrl = "http://localhost:3001";
	/*
		config.baseUrl ??
		process.env.NEXT_PUBLIC_BACKEND_URL ??
		process.env.BACKEND_URL ??
		process.env.NEXT_PUBLIC_API_BASE_URL ??
		process.env.API_BASE_URL ??
		"http://localhost:3001";
	*/

	async function request<TResponse, TBody = unknown>(
		options: ApiRequestOptions<TBody>
	): Promise<TResponse> {
		const method = (options.method ?? "GET").toUpperCase();
		const url = buildUrl(baseUrl || undefined, options.path, options.query);

		let authHeaders: HeadersInit | undefined;
		try {
			authHeaders = config.getAuthHeaders ? await config.getAuthHeaders() : undefined;
		} catch {
			// Auth header retrieval should never break requests.
			authHeaders = undefined;
		}

		const contentHeaders: HeadersInit = { Accept: "application/json" };

		let body: BodyInit | undefined;
		if (options.body !== undefined && options.body !== null && method !== "GET") {
			if (isFormData(options.body)) {
				body = options.body;
			} else if (isBlob(options.body) || typeof options.body === "string") {
				body = options.body;
			} else {
				body = JSON.stringify(options.body);
				(contentHeaders as Record<string, string>)["Content-Type"] =
					"application/json";
			}
		}

		const headers = mergeHeaders(
			config.defaultHeaders,
			contentHeaders,
			authHeaders,
			options.headers
		);

		try {
			const res = await fetch(url, {
				...options.init,
				method,
				headers,
				body,
			});

			const responseBody = await readResponseBody(res);

			if (!res.ok) {
				const message = extractErrorMessage(
					responseBody,
					`Request failed (${res.status})`
				);

				throw new ApiError({
					message,
					status: res.status,
					url,
					errorBody: responseBody,
				});
			}

			return responseBody as TResponse;
		} catch (err) {
			if (err instanceof ApiError) throw err;
			const message = err instanceof Error ? err.message : "Network error";
			throw new ApiError({ message, status: null, url });
		}
	}

	return {
		request,
		get: <TResponse>(
			path: string,
			options?: Omit<ApiRequestOptions<never>, "method" | "path" | "body">
		) => request<TResponse>({ ...options, method: "GET", path }),
		post: <TResponse, TBody = unknown>(
			path: string,
			body?: TBody,
			options?: Omit<ApiRequestOptions<TBody>, "method" | "path" | "body">
		) => request<TResponse, TBody>({ ...options, method: "POST", path, body }),
		patch: <TResponse, TBody = unknown>(
			path: string,
			body?: TBody,
			options?: Omit<ApiRequestOptions<TBody>, "method" | "path" | "body">
		) => request<TResponse, TBody>({ ...options, method: "PATCH", path, body }),
		put: <TResponse, TBody = unknown>(
			path: string,
			body?: TBody,
			options?: Omit<ApiRequestOptions<TBody>, "method" | "path" | "body">
		) => request<TResponse, TBody>({ ...options, method: "PUT", path, body }),
		delete: <TResponse>(
			path: string,
			options?: Omit<ApiRequestOptions<never>, "method" | "path" | "body">
		) => request<TResponse>({ ...options, method: "DELETE", path }),
	};
}

export const api = createApiClient();

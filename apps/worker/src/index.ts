type WorkerEnv = {
	POLAR_ACCESS_TOKEN: string;
	POLAR_ORGANIZATION_ID: string;
	POLAR_API_BASE_URL?: string;
	CONTEXT: KVNamespace;
};

type ValidatedLicenseKey = {
	id: string;
	status: 'granted' | 'revoked' | 'disabled';
};

type PolarResult<T> = { ok: true; value: T } | { ok: false; status: number; message: string };

const DEFAULT_POLAR_API_BASE_URL = 'https://api.polar.sh';

const CORS_HEADERS = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'GET,POST,OPTIONS',
	'access-control-allow-headers': 'content-type, authorization',
};

export default {
	async fetch(request: Request, env: WorkerEnv): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		if (request.method === 'GET' && url.pathname === '/') {
			return jsonResponse({ ok: true, name: 'lore-worker', endpoints: ['POST /validate', 'GET /context'] });
		}

		if (request.method === 'POST' && url.pathname === '/validate') {
			return handleValidate({ request, env });
		}

		if (request.method === 'GET' && url.pathname === '/context') {
			return handleContext({ request, env });
		}

		return jsonResponse({ message: 'Not found.' }, 404);
	},
} satisfies ExportedHandler<WorkerEnv>;

async function handleValidate({ request, env }: { request: Request; env: WorkerEnv }): Promise<Response> {
	const configError = getConfigError(env);
	if (configError) return jsonResponse({ message: configError }, 500);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return jsonResponse({ message: 'Request body must be valid JSON.' }, 400);
	}

	if (!isRecord(body)) return jsonResponse({ message: 'Request body must be a JSON object.' }, 400);

	const key = readTrimmedString(body.key);
	if (!key) return jsonResponse({ message: 'key is required.' }, 400);

	const result = await validateLicenseKey(key, env);
	if (result.ok === false) {
		return jsonResponse({ message: result.message }, result.status === 404 ? 401 : result.status);
	}

	return jsonResponse({ ok: true });
}

async function handleContext({ request, env }: { request: Request; env: WorkerEnv }): Promise<Response> {
	const configError = getConfigError(env);
	if (configError) return jsonResponse({ message: configError }, 500);

	const key = readBearerToken(request);
	if (!key) return jsonResponse({ message: 'A license key is required.' }, 401);

	const result = await validateLicenseKey(key, env);
	if (!result.ok) return jsonResponse({ message: 'Invalid or inactive license key.' }, 401);

	const content = await env.CONTEXT.get('context');
	if (!content) return jsonResponse({ message: 'Context not configured.' }, 404);

	return new Response(content, {
		status: 200,
		headers: { 'content-type': 'text/plain; charset=utf-8', ...CORS_HEADERS },
	});
}

async function validateLicenseKey(
	key: string,
	env: WorkerEnv,
): Promise<{ ok: true } | { ok: false; status: number; message: string }> {
	const result = await polarRequest<ValidatedLicenseKey>({
		env,
		path: '/v1/license-keys/validate',
		method: 'POST',
		body: { key, organization_id: env.POLAR_ORGANIZATION_ID },
	});

	if (!result.ok) return result;
	if (result.value.status !== 'granted') {
		return { ok: false, status: 403, message: 'License key is not active.' };
	}

	return { ok: true };
}

async function polarRequest<T>({
	env,
	path,
	method = 'GET',
	body,
	expectedStatus = 200,
}: {
	env: WorkerEnv;
	path: string;
	method?: 'GET' | 'POST';
	body?: Record<string, unknown>;
	expectedStatus?: number;
}): Promise<PolarResult<T>> {
	let response: Response;

	try {
		response = await fetch(`${getPolarApiBaseUrl(env)}${path}`, {
			method,
			headers: {
				authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`,
				'content-type': 'application/json',
			},
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch {
		return { ok: false, status: 502, message: "Couldn't reach Polar." };
	}

	if (response.status !== expectedStatus) {
		return {
			ok: false,
			status: response.status,
			message: (await readPolarErrorMessage(response)) ?? `Polar request failed with status ${response.status}.`,
		};
	}

	if (expectedStatus === 204) return { ok: true, value: undefined as T };

	return { ok: true, value: (await response.json()) as T };
}

function getPolarApiBaseUrl(env: WorkerEnv): string {
	return (env.POLAR_API_BASE_URL?.trim() || DEFAULT_POLAR_API_BASE_URL).replace(/\/$/, '');
}

async function readPolarErrorMessage(response: Response): Promise<string | undefined> {
	let value: unknown;
	try {
		value = await response.json();
	} catch {
		return undefined;
	}

	if (!isRecord(value)) return undefined;

	const { detail } = value;
	if (typeof detail === 'string') return detail;
	if (Array.isArray(detail)) {
		const first = detail[0];
		if (isRecord(first) && typeof first.msg === 'string') return first.msg;
	}

	return readTrimmedString(value.message) ?? readTrimmedString(value.error);
}

function getConfigError(env: WorkerEnv): string | undefined {
	if (!env.POLAR_ACCESS_TOKEN?.trim()) return 'POLAR_ACCESS_TOKEN is not configured.';
	if (!env.POLAR_ORGANIZATION_ID?.trim()) return 'POLAR_ORGANIZATION_ID is not configured.';
	return undefined;
}

function readBearerToken(request: Request): string | undefined {
	const header = request.headers.get('authorization');
	if (!header?.startsWith('Bearer ')) return undefined;
	const token = header.slice(7).trim();
	return token || undefined;
}

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json; charset=utf-8', ...CORS_HEADERS },
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTrimmedString(value: unknown): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed || undefined;
}

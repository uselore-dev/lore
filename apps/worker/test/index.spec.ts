import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

function makeEnv(contextContent: string | null = null) {
	return {
		POLAR_ACCESS_TOKEN: 'polar-token',
		POLAR_ORGANIZATION_ID: 'org-id',
		POLAR_API_BASE_URL: 'https://api.polar.sh',
		CONTEXT: { get: vi.fn().mockResolvedValue(contextContent) } as unknown as KVNamespace,
	};
}

function stubFetch(...responses: Response[]) {
	const fetchMock = vi.fn<typeof fetch>();
	vi.stubGlobal('fetch', fetchMock);
	for (const response of responses) {
		fetchMock.mockResolvedValueOnce(response);
	}
	return fetchMock;
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Lore license worker', () => {
	it('returns a health response from GET /', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			ok: true,
			name: 'lore-worker',
			endpoints: ['POST /validate', 'GET /context'],
		});
	});

	it('returns 404 for an unknown route', async () => {
		const request = new IncomingRequest('http://example.com/unknown');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, makeEnv(), ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(404);
	});

	describe('POST /validate', () => {
		it('returns 400 when the key is missing', async () => {
			const request = new IncomingRequest('http://example.com/validate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({}),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ message: 'key is required.' });
		});

		it('returns 400 for invalid JSON', async () => {
			const request = new IncomingRequest('http://example.com/validate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: 'not json',
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ message: 'Request body must be valid JSON.' });
		});

		it('returns 401 when Polar does not recognise the key', async () => {
			stubFetch(new Response(null, { status: 404 }));
			const request = new IncomingRequest('http://example.com/validate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: 'bad-key' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
		});

		it('returns 403 when the license key is not granted', async () => {
			stubFetch(Response.json({ id: 'key-id', status: 'revoked' }));
			const request = new IncomingRequest('http://example.com/validate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: 'revoked-key' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(403);
		});

		it('returns ok for a valid granted key', async () => {
			const fetchMock = stubFetch(Response.json({ id: 'key-id', status: 'granted' }));
			const request = new IncomingRequest('http://example.com/validate', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ key: 'valid-key' }),
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ ok: true });
			expect(String(fetchMock.mock.calls[0]?.[1]?.body)).toContain('"key":"valid-key"');
		});
	});

	describe('GET /context', () => {
		it('returns 401 when no authorization header is provided', async () => {
			const request = new IncomingRequest('http://example.com/context');
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
		});

		it('returns 401 when the license key is invalid', async () => {
			stubFetch(new Response(null, { status: 404 }));
			const request = new IncomingRequest('http://example.com/context', {
				headers: { authorization: 'Bearer bad-key' },
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(401);
		});

		it('returns 404 when context is not configured in KV', async () => {
			stubFetch(Response.json({ id: 'key-id', status: 'granted' }));
			const request = new IncomingRequest('http://example.com/context', {
				headers: { authorization: 'Bearer valid-key' },
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv(null), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(404);
		});

		it('returns the context as plain text for a valid key', async () => {
			stubFetch(Response.json({ id: 'key-id', status: 'granted' }));
			const request = new IncomingRequest('http://example.com/context', {
				headers: { authorization: 'Bearer valid-key' },
			});
			const ctx = createExecutionContext();
			const response = await worker.fetch(request, makeEnv('# rules content'), ctx);
			await waitOnExecutionContext(ctx);
			expect(response.status).toBe(200);
			expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
			expect(await response.text()).toBe('# rules content');
		});
	});
});

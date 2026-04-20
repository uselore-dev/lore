import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

const testEnv = {
	POLAR_ACCESS_TOKEN: 'polar-token',
	POLAR_ORGANIZATION_ID: 'org-id',
	POLAR_API_BASE_URL: 'https://api.polar.sh',
};

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

describe('Lore license worker', () => {
	it('returns a health response from GET /', async () => {
		const request = new IncomingRequest('http://example.com');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			ok: true,
			name: 'lore-license-worker',
			endpoints: ['POST /activate'],
		});
	});

	it('rejects an activation request without a device ID', async () => {
		const request = new IncomingRequest('http://example.com/activate', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				key: 'license-key',
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, testEnv, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			message: 'A deviceId is required.',
		});
	});

	it('transfers the license to the current device', async () => {
		const fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);
		fetchMock
			.mockResolvedValueOnce(
				Response.json({
					id: 'license-key-id',
					status: 'granted',
				}),
			)
			.mockResolvedValueOnce(
				Response.json({
					activations: [{ id: 'old-activation-1' }, { id: 'old-activation-2' }],
				}),
			)
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }))
			.mockResolvedValueOnce(
				Response.json({
					id: 'new-activation-id',
				}),
			);

		const request = new IncomingRequest('http://example.com/activate', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify({
				key: 'license-key',
				deviceId: 'machine-123',
			}),
		});
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, testEnv, ctx);
		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			activationId: 'new-activation-id',
		});
		expect(fetchMock).toHaveBeenCalledTimes(5);
		expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
			'https://api.polar.sh/v1/license-keys/validate',
			'https://api.polar.sh/v1/license-keys/license-key-id',
			'https://api.polar.sh/v1/license-keys/deactivate',
			'https://api.polar.sh/v1/license-keys/deactivate',
			'https://api.polar.sh/v1/license-keys/activate',
		]);
		expect(JSON.parse(String(fetchMock.mock.calls[4]?.[1]?.body))).toEqual({
			key: 'license-key',
			organization_id: 'org-id',
			label: 'machine-123',
			meta: {
				app: 'lore',
			},
		});
	});
});

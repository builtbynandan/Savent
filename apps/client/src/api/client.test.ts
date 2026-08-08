import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, apiRequest, sessionExpiredEvent } from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('apiRequest', () => {
  it('returns a useful error when the API cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));

    await expect(apiRequest('/transactions')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('handles a non-JSON server failure without leaking parser errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('Bad gateway', {
          status: 502,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    await expect(apiRequest('/transactions')).rejects.toEqual(
      new ApiError(
        'Savent is temporarily unavailable. Please try again.',
        502,
        'REQUEST_FAILED',
      ),
    );
  });

  it('announces an expired authenticated session on a 401 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 },
        ),
      ),
    );
    const listener = vi.fn();
    window.addEventListener(sessionExpiredEvent, listener);

    await expect(apiRequest('/transactions')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
    expect(listener).toHaveBeenCalledOnce();

    window.removeEventListener(sessionExpiredEvent, listener);
  });
});

import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '../src/index.js';

describe('authentication contracts', () => {
  it('normalises registration details', () => {
    expect(
      registerSchema.parse({
        name: '  Nandan  ',
        email: 'NANDAN@EXAMPLE.COM',
        password: 'strong-password',
      }),
    ).toEqual({
      name: 'Nandan',
      email: 'nandan@example.com',
      password: 'strong-password',
    });
  });

  it('rejects invalid credentials before they reach the API', () => {
    expect(() =>
      loginSchema.parse({ email: 'not-an-email', password: 'short' }),
    ).toThrow();
  });
});

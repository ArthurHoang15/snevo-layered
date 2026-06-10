import assert from 'node:assert/strict';
import test from 'node:test';

let AuthServiceClass;

async function createAuthService() {
  globalThis.window = {
    location: {
      origin: 'http://localhost:3001',
      hostname: 'localhost',
    },
  };

  if (!AuthServiceClass) {
    const module = await import('../frontend/assets/js/services/AuthService.js');
    AuthServiceClass = globalThis.window.AuthService || module.default.constructor;
  }

  return new AuthServiceClass();
}

test('Google OAuth success returns success result for UI handlers', async () => {
  const authService = await createAuthService();
  authService.supabase = {
    auth: {
      signInWithOAuth: async () => ({
        data: { url: 'https://accounts.google.com/o/oauth2/v2/auth' },
        error: null,
      }),
    },
  };

  const result = await authService.loginWithGoogle();

  assert.equal(result.success, true);
  assert.equal(result.error, null);
  assert.equal(result.redirecting, true);
  assert.equal(result.message, 'Redirecting to Google...');
});

test('Google OAuth failure returns displayable error text', async () => {
  const authService = await createAuthService();
  const oauthError = { message: 'Provider is not enabled' };
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    authService.supabase = {
      auth: {
        signInWithOAuth: async () => ({
          data: null,
          error: oauthError,
        }),
      },
    };

    const result = await authService.loginWithGoogle();

    assert.equal(result.success, false);
    assert.equal(result.error, 'Provider is not enabled');
    assert.equal(result.rawError, oauthError);
  } finally {
    console.error = originalConsoleError;
  }
});

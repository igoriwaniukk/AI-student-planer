import { describe, it, expect } from 'vitest';
import { parseAuthCallback, isNativeApp } from './nativeBridge';

describe('parseAuthCallback', () => {
  it('reads tokens from the #fragment (implicit flow)', () => {
    expect(parseAuthCallback('pulgo://auth-callback#access_token=a.b.c&refresh_token=r1&expires_in=3600&token_type=bearer')).toMatchObject({
      accessToken: 'a.b.c', refreshToken: 'r1', code: null, error: null,
    });
  });
  it('reads a PKCE code from the query', () => {
    expect(parseAuthCallback('pulgo://auth-callback?code=xyz').code).toBe('xyz');
  });
  it('passes the provider error through', () => {
    expect(parseAuthCallback('pulgo://auth-callback?error=access_denied&error_description=User+cancelled').error).toBe('User cancelled');
  });
  it('copes with garbage', () => {
    expect(parseAuthCallback('not a url')).toEqual({});
  });
});

describe('isNativeApp', () => {
  it('is false outside the iPhone app', () => {
    expect(isNativeApp()).toBe(false);
  });
});

import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

// Google doesn't allow signing in inside an embedded web view, so the
// website hands us the sign-in address and we open it in the phone's own
// sign-in sheet. Supabase sends the student back to `redirect`
// (pulgo://auth-callback), which closes the sheet with the session in it.
export async function openSignInSheet(url, redirect) {
  if (!/^https:\/\//.test(url || '')) return { error: 'Invalid sign-in address.' };
  const res = await WebBrowser.openAuthSessionAsync(url, redirect);
  if (res.type === 'success') return { url: res.url };
  return { cancelled: true };
}

// Apple's native Face ID sheet. The website swaps the identity token for a
// Supabase session; `unavailable` makes it fall back to the sheet above.
export async function signInWithApple() {
  if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) return { unavailable: true };
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    if (!credential.identityToken) return { unavailable: true };
    return { identityToken: credential.identityToken, rawNonce };
  } catch (e) {
    if (e?.code === 'ERR_REQUEST_CANCELED') return { cancelled: true };
    return { unavailable: true };
  }
}

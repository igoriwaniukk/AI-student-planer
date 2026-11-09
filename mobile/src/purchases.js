import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

// Pulgo Premium through Apple's in-app purchase, handled by RevenueCat. The
// website asks for prices, a purchase or a restore over the bridge (see
// App.js); purchases are logged in under the student's Supabase user id, so
// the server (api/_lib/premium.js) can look them up in RevenueCat.
//
// The key in app.json → expo.extra.revenueCatIosKey is RevenueCat's public
// iOS SDK key (starts with appl_). It is meant to ship inside the app; the
// secret key lives only in Vercel. Without it, Premium simply isn't offered.

const IOS_KEY = Constants.expoConfig?.extra?.revenueCatIosKey || '';
const ENTITLEMENT = 'premium';
let configured = false;

function ready() {
  if (configured) return true;
  if (Platform.OS !== 'ios' || !IOS_KEY) return false;
  try {
    Purchases.configure({ apiKey: IOS_KEY });
    configured = true;
  } catch {
    return false;
  }
  return true;
}

async function asUser(userId) {
  if (!userId) return;
  try { await Purchases.logIn(userId); } catch { /* stays anonymous; restore still works */ }
}

const hasPremium = (info) => !!info?.entitlements?.active?.[ENTITLEMENT];
const priceOf = (pkg) => (pkg?.product ? { price: pkg.product.price, currency: pkg.product.currencyCode, text: pkg.product.priceString } : null);

// { yearly: { price, currency, text }, monthly: {…} } from the current offering.
export async function getOfferings() {
  if (!ready()) return { error: 'unavailable' };
  try {
    const current = (await Purchases.getOfferings()).current;
    const yearly = priceOf(current?.annual);
    const monthly = priceOf(current?.monthly);
    return yearly && monthly ? { yearly, monthly } : { error: 'no-offering' };
  } catch {
    return { error: 'failed' };
  }
}

export async function purchase(plan, userId) {
  if (!ready()) return { error: 'unavailable' };
  try {
    await asUser(userId);
    const current = (await Purchases.getOfferings()).current;
    const pkg = plan === 'monthly' ? current?.monthly : current?.annual;
    if (!pkg) return { error: 'no-offering' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, premium: hasPremium(customerInfo) };
  } catch (e) {
    if (e?.userCancelled) return { cancelled: true };
    return { error: 'failed' };
  }
}

export async function restore(userId) {
  if (!ready()) return { error: 'unavailable' };
  try {
    await asUser(userId);
    return { premium: hasPremium(await Purchases.restorePurchases()) };
  } catch {
    return { error: 'failed' };
  }
}

export async function signOut() {
  if (!configured) return;
  try { await Purchases.logOut(); } catch { /* already anonymous */ }
}

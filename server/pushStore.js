import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// One JSON file holding every subscribed device (this is a single-user demo
// app run locally, not a multi-tenant service — no database needed).
// Keyed by the push subscription's endpoint URL, which is unique per device.
const FILE_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'push-subscriptions.json');

function load() {
  if (!existsSync(FILE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function persist(all) {
  writeFileSync(FILE_PATH, JSON.stringify(all, null, 2));
}

export function saveSubscription(subscription, state) {
  const all = load();
  all[subscription.endpoint] = { subscription, state: state || {}, tick: 0 };
  persist(all);
}

export function updateState(endpoint, state) {
  const all = load();
  if (!all[endpoint]) return false;
  all[endpoint].state = state || {};
  persist(all);
  return true;
}

export function removeSubscription(endpoint) {
  const all = load();
  if (!(endpoint in all)) return false;
  delete all[endpoint];
  persist(all);
  return true;
}

export function allSubscriptions() {
  return Object.values(load());
}

export function bumpTick(endpoint) {
  const all = load();
  if (!all[endpoint]) return 0;
  all[endpoint].tick = (all[endpoint].tick || 0) + 1;
  persist(all);
  return all[endpoint].tick;
}

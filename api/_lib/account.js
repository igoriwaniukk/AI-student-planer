import { getVerifiedUser, authGateEnabled } from './auth.js';
import { supabaseAdmin, supabaseAdminConfigured } from './supabaseAdmin.js';

// Permanently deletes the signed-in caller's account. Only the service-role
// key can delete an auth.users row, so this always goes through the server
// rather than a direct client-side Supabase call. Deleting the auth user
// cascades to their user_data row (see "on delete cascade" in
// supabase/schema.sql), so there's nothing else to clean up here.
export async function handleAccountDelete(authorizationHeader) {
  if (!authGateEnabled) {
    return { status: 400, body: { error: 'Konta nie są tu skonfigurowane.' } };
  }
  const user = await getVerifiedUser(authorizationHeader);
  if (!user) {
    return { status: 401, body: { error: 'Musisz być zalogowany, aby usunąć konto.' } };
  }
  if (!supabaseAdminConfigured) {
    return { status: 500, body: { error: 'Usuwanie konta nie jest skonfigurowane na serwerze (brak SUPABASE_SERVICE_ROLE_KEY).' } };
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    return { status: 500, body: { error: 'Nie udało się usunąć konta. Spróbuj ponownie.' } };
  }
  return { status: 200, body: { ok: true } };
}

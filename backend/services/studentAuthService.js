const { createClient } = require('@supabase/supabase-js');
const { getSupabaseStorageConfig, getSupabaseStorageClient } = require('./supabaseStorageService');

// Never sign in on the shared service-role client: auth-js changes its bearer
// token after sign-in. Each credential check gets an isolated, ephemeral client.
async function verifyStudentPassword(account, password) {
  if (account.authProvider !== 'supabase' || account.role !== 'student' || !account.authUserId) return false;
  const config = getSupabaseStorageConfig();
  const authClient = createClient(config.url, config.publishableKey || config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  let response;
  try { response = await authClient.auth.signInWithPassword({ email: account.email, password }); }
  catch { throw Object.assign(new Error('Authentication is temporarily unavailable. Please try again.'), { statusCode: 503 }); }
  if (response.error) {
    if (Number(response.error.status) >= 500 || response.error.name === 'AuthRetryableFetchError') {
      throw Object.assign(new Error('Authentication is temporarily unavailable. Please try again.'), { statusCode: 503 });
    }
    return false;
  }
  const user = response.data?.user;
  const valid = user?.id === account.authUserId && !!user?.email_confirmed_at
    && String(user.email).toLowerCase() === String(account.email).toLowerCase();
  // Discard the short-lived Supabase session; EduMatch retains its existing
  // revocable application session, OTP, CAPTCHA and lockout controls.
  try { await authClient.auth.signOut({ scope: 'local' }); } catch { /* No session is persisted. */ }
  return valid;
}

async function updateStudentPassword(account, password) {
  if (account.authProvider !== 'supabase' || account.role !== 'student' || !account.authUserId) {
    throw Object.assign(new Error('The student sign-in identity is invalid.'), { statusCode: 400 });
  }
  const { error } = await getSupabaseStorageClient().auth.admin.updateUserById(account.authUserId, { password });
  if (error) throw Object.assign(new Error('Unable to update your password. Please try again.'), { statusCode: 503 });
}

module.exports = { verifyStudentPassword, updateStudentPassword };

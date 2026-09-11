# Security changes and deployment

The backend now uses Supabase for session validation, logout, session revocation,
and administrator security settings. Existing administrator accounts are preserved
on startup. A first administrator requires an explicit `ADMIN_PASSWORD` meeting
the existing password policy and must change that password after signing in.

Apply migrations `001` through `006` on a new database. The existing connected
project has all 17 application tables. The security check confirmed that the
public key cannot directly access these tables. The configured application file
bucket was changed from public to private and verified on September 7, 2026;
no files were deleted. These observations describe that project at check time.

## Local development

Run `npm test` and `npm run security:check -- --live` from `backend`.
The live check performs metadata and HEAD requests; it does not fetch student
records, modify data, or print credentials. Tests use local fixtures, not the
connected database. Run the backend with `npm run dev` or `npm start`.

`REDIS_URL` may be empty locally. `.env` takes precedence over `.env.local`,
and environment variables supplied by the host take precedence over either file.
The updated `.env.example` describes the required settings. Existing `.env` files
were not overwritten.

## Production configuration

Configure these values in the backend host's environment:

- `NODE_ENV=production`
- `JWT_SECRET`: a randomly generated secret of at least 32 bytes.
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`: the backend project's HTTPS URL
  and server credential. Do not put the service credential in frontend `VITE_*`
  variables or source control.
- `SUPABASE_STORAGE_BUCKET`: the application's private bucket;
  `SUPABASE_STORAGE_PUBLIC=false`.
- `REDIS_URL`: a real Redis connection, preferably `rediss://` for a hosted TLS
  service. The existing client does not accept an HTTPS Redis REST endpoint.
- `TRUST_PROXY`: explicitly match the host's proxy topology. `0` is appropriate
  only for a directly exposed backend. A numeric hop count is safe only when all
  routes to the backend traverse that many trusted proxies and client forwarding
  headers are sanitized. Do not blindly use `true` or copy `1` without verifying
  the deployment topology.
- `CORS_ALLOWED_ORIGINS` or `FRONTEND_URL`: exact HTTPS frontend origins separated
  by commas, without paths or wildcards. Keep `FRONTEND_URL`/`APP_BASE_URL` correct
  for invitation and password-reset links as well.
- Optional `STORAGE_URL_SIGNING_SECRET`: a separate random secret of at least
  32 bytes; leave blank to use `JWT_SECRET`.

Run `npm run security:check -- --production --live` with the deployment
environment. Production startup fails if required configuration is missing or
the application bucket cannot be verified as private. Both the exported Express
handler (including Vercel imports) and `npm start` use the same initialization.
The code has not been deployed by this change. No Redis service was provisioned
or credentials invented; those settings must come from your hosting environment.

Redis connection attempts are bounded, initialization waits for the shared store
scripts, and store failures reject requests rather than disabling limits.
Authenticated API budgets are assigned using a verified JWT signature; route
authentication still checks the account and persisted session. This separates
students sharing one school IP. Unauthenticated requests use IP budgets.
Valid signed file requests use a separate per-file/IP budget, because browser
images and PDF frames do not carry the login Authorization header.

The limits remain: API 300/15 minutes, sign-in and OTP verification 10/15 minutes,
password resets 5/hour, invitations 20/15 minutes, uploads 30/hour, and AI
generation 10/15 minutes. Related endpoints share each specialized budget.

## File access and database permissions

`/uploads/...` is no longer publicly served. Obtain fresh URLs through the normal
authorized API responses. Local and Supabase files use expiring signed links;
existing absolute URLs under `/uploads/` are converted when serialized. Old cached
public file URLs may stop working until the page refreshes its data.
Signed links are bearer grants: anyone holding one can use it until it expires,
even after the issuing login session ends. The default lifetime is one hour,
controlled by `SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS`.

Startup checks bucket visibility but does not change permissions automatically.
For a new environment, explicitly run `npm run storage:secure` to make only the
configured application bucket private. The command preserves files and other
bucket settings. Setting `SUPABASE_STORAGE_PUBLIC=false` alone cannot change the
actual Supabase bucket.

Run `backend/supabase/security_audit.sql` in the Supabase SQL Editor to inspect
RLS flags, grants for both browser roles, bucket visibility, and existing policies.
Application tables should have RLS enabled and no privileges for `anon` or
`authenticated`. Review storage policies for broad browser access as well;
a private bucket can still have permissive policies. The automated live check
verifies public-key table denial, not every database role and operation.

Keep the existing backend-only database design: service-role queries bypass RLS,
so adding permissive browser policies does not strengthen backend authorization.
Fine-grained per-user database policies require a separate design using a
non-bypass role and trusted user identity. This change does not introduce those
policies or claim a complete application security audit.

## Security settings

Administrator settings are saved in Supabase `app_settings` and read by all
backend instances. Missing settings use the existing safe defaults; database
read failures block authentication instead of disabling policy enforcement.
If settings were previously saved only in MongoDB, review and save them through
the administrator screen after this update; no legacy MongoDB settings were
automatically migrated.

The configured inactivity timeout applies to each session, including remembered
sessions. Remember-me extends the absolute token lifetime, not inactivity.
Background presence heartbeats do not reset the timeout. Other authenticated API
activity does. Maintenance prevents non-admin access and new sign-ins, and
enabling it revokes non-admin sessions. Password-change-required accounts retain
access to changing their password, logout, and session management.

## Reference documentation

- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase bucket access model](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Express proxy configuration](https://expressjs.com/en/guide/behind-proxies/)
- [Rate-limit stores](https://express-rate-limit.mintlify.app/overview)
- [Vercel Express deployment](https://vercel.com/docs/frameworks/backend/express)

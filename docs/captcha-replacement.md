# EduMatch math CAPTCHA implementation

The existing Vue login form now uses addition and nonnegative subtraction, with verification in the existing Express backend. Password authentication, account activation, password resets, OTP, sessions, account lockouts, dashboards and database connections retain their existing behavior.

## ReCAPTZ compatibility

The actual [ReCAPTZ documentation](https://github.com/ShejanMahamud/ReCAPTZ) describes a React CAPTCHA component. Its public math component generates its challenge and answer in the browser. It does not expose a supported way to display an arbitrary server-issued math question while keeping its answer exclusively on the server, or a native Vue component.

This implementation uses the custom-backend fallback permitted in the request, with a native Vue widget. **The ReCAPTZ npm library is not installed or used.** Adding a separate React runtime or inventing component properties would not satisfy the existing Vue application's requirements. The implementation does not claim to be a ReCAPTZ library integration.

## Complete source files

The complete updated code is in these existing project files; no new application was created.

| File | Change |
| --- | --- |
| `frontend/src/components/MathCaptcha.vue` | New reusable Vue component with answer input, Verify/Refresh controls, success/error status, expiry and request cleanup. |
| `frontend/src/views/auth/LoginView.vue` | Replaces the Google widget/loader and uses the component's server-issued proof before login. |
| `frontend/src/stores/auth.js` | Exports the existing API-base resolver for reuse; the login payload still uses `captchaToken`. |
| `frontend/public/service-worker.js` | Advances the cache version so installed clients update the old login assets. |
| `backend/services/mathCaptchaService.js` | New cryptographic challenge/proof lifecycle, bounded development store and atomic Redis store. |
| `backend/controllers/captchaController.js` | New challenge and verification HTTP handlers, structured errors and no-store responses. |
| `backend/controllers/authController.js` | Removes Google verification and consumes the one-use math proof before account authentication. |
| `backend/routes/authRoutes.js` | Adds the two public, rate-limited CAPTCHA endpoints. |
| `backend/middlewares/rateLimiters.js` | Adds separate CAPTCHA limits and reuses the existing shared Redis connection. |
| `backend/middlewares/auditLogMiddleware.js` | Omits CAPTCHA answers and identifiers from audit metadata. |
| `backend/tests/mathCaptcha.test.js` | New lifecycle, HTTP, concurrency and Redis transport tests; optional real Redis integration. |
| `backend/tests/securitySettings.test.js` | Migrates Google mocks and verifies proof enforcement alongside existing authentication/OTP tests. |
| `backend/tests/redisRateLimits.test.js` | Accounts for the two additional Redis-backed limiters. |
| `frontend/scripts/verify-math-captcha.mjs` | Repeatable isolated browser checks at mobile and desktop widths. |
| `vercel.json` | Removes the Google CAPTCHA script/frame allowances from the existing CSP. |
| `frontend/.env`, `frontend/.env.local.example` | Removes Google CAPTCHA site-key variables. |
| `backend/.env`, `backend/.env.local`, `backend/.env.example` | Removes Google CAPTCHA key/hostname variables. Local files remain untracked where already ignored. |
| `docs/edumatch-simple-dfd.md` | Updates only the CAPTCHA descriptions. |
| `docs/captcha-replacement.md` | This setup and verification guide. |

Only the login form previously used Google CAPTCHA. Invitation-based account activation, staff-created student/teacher accounts, forgot-password and OTP endpoints therefore receive no additional CAPTCHA. Their existing authentication, authorization and rate limits remain in place.

## Dependencies and configuration

**New dependencies to install: none. Dependencies to uninstall: none.** Neither package manifest nor lockfile contained a Google CAPTCHA package; the old integration loaded a script directly. The replacement uses existing Vue, Axios, Node crypto, Express, Redis and rate-limit dependencies. Playwright is already a frontend development dependency.

No CAPTCHA API key or new runtime environment variable is needed. These existing settings continue to apply:

```dotenv
# Backend: development can leave this blank; production requires shared Redis.
NODE_ENV=development
REDIS_URL=
TRUST_PROXY=0
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173

# Optional frontend API override. Omit for the existing same-origin /api default.
VITE_API_BASE_URL=http://localhost:5000/api
```

The maintained environment examples contain the rest of the existing application configuration. Keep the existing Supabase, JWT, storage and mail configuration. No unrelated Google service is removed.

Remove the obsolete `VITE_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY` and `RECAPTCHA_ALLOWED_HOSTNAMES` settings from hosting dashboards when deploying the updated source. Local occurrences were removed. Deploy the frontend and backend together using the project's existing deployment process; no database migration is needed. All backend instances must use the same existing `REDIS_URL` in production.

## Verification flow

1. `POST /api/auth/captcha/challenge` accepts `{}` or `{ "previousChallengeId": "..." }`. The server creates a cryptographically random 256-bit identifier and random operands from 1 through 10. Only `+` and `−` occur; subtraction operands are ordered so the answer is nonnegative.
2. The response is `{ "success": true, "data": { "challengeId": "...", "question": "9 − 4 = ?", "expiresAt": "..." } }`. It contains no answer, answer hash or signing secret.
3. `POST /api/auth/captcha/verify` accepts `{ "challengeId": "...", "answer": "5" }`. The server checks the stored answer and expiry. Three incorrect numeric attempts invalidate the challenge. Missing/malformed answers are rejected; endpoint rate limits also apply.
4. A correct answer consumes the question phase and returns `{ "success": true, "data": { "captchaToken": "...", "expiresAt": "..." } }`. This opaque 256-bit proof inherits the original challenge expiry; solving it does not extend the five-minute lifetime.
5. The existing `/api/auth/login` payload includes this proof as `captchaToken`. The server atomically consumes it before looking up the account or checking its password. Missing, fabricated, unsolved, expired and previously consumed proofs fail. A failed password attempt also consumes its proof.
6. Refresh invalidates the old challenge and any proof it issued. The widget refreshes on expiry, exhausted attempts, unusable challenges and failed credential login. A network error clears usable local state and leaves Refresh available. OTP completion continues to use its existing OTP challenge, without another CAPTCHA solve.

The development memory store has a 10,000-challenge cap and prunes expired entries. Production, and development with a configured Redis URL, use shared Redis records with absolute expiry. Lua scripts atomically verify, refresh and consume records across backend instances; Redis failures reject the request instead of falling back to per-process memory. CAPTCHA creation is limited to 30 requests and answer verification to 60 requests per IP in 15 minutes, alongside the existing login and API limits.

Arithmetic presented as text can be solved by automated programs. Server enforcement prevents proof fabrication and replay, while the existing rate limits and authentication controls remain necessary; this is not equivalent to Google's risk analysis or advanced bot detection.

## Run and test

Start the backend and frontend with their existing commands after supplying the application's existing configuration:

```powershell
# In backend/
npm.cmd start

# In frontend/, in a separate terminal
npm.cmd run dev
```

Run the backend suite and frontend build:

```powershell
# In backend/
npm.cmd test
# Or only the CAPTCHA/authentication suites:
node --test tests/mathCaptcha.test.js tests/securitySettings.test.js tests/redisRateLimits.test.js

# In frontend/
npm.cmd run build
```

The optional actual Redis Lua test needs a **dedicated test Redis**, using `CAPTCHA_TEST_REDIS_URL`. It uses a unique temporary namespace and TTLs, never flushes Redis, and never reads the application's `REDIS_URL` as a test target.

To repeat the browser checks, start Vite on the test port and run the script in a separate terminal:

```powershell
# In frontend/, terminal 1
$env:VITE_API_BASE_URL='/api'
npm.cmd run dev -- --host 127.0.0.1 --port 5189 --strictPort

# In frontend/, terminal 2
# Optional: use already-installed Edge when Playwright Chromium isn't installed.
$env:CAPTCHA_BROWSER_CHANNEL='msedge'
node scripts/verify-math-captcha.mjs
```

Alternatively omit `CAPTCHA_BROWSER_CHANNEL` to use installed Playwright Chromium. `CAPTCHA_UI_BASE_URL` can point the browser script at another local Vite origin. The script intercepts application APIs, invokes the real in-memory math service, and uses synthetic login/OTP responses. It blocks external requests, sends no emails and does not connect to the application database. Reports and screenshots are written to the already-ignored `frontend/.tailwind-migration/math-captcha/` directory.

Manual checks with an existing local test account: solve each operation, try an empty and wrong answer, refresh, leave a question for five minutes, sign in with an incorrect password, then solve again and complete the normal login/OTP flow. A direct login request without a verified proof must return 400. In browser network tools, no Google CAPTCHA script or frame should appear.

## Validation results

- Full backend suite: **312 passed, 1 skipped, 0 failed**. The skipped test requires a dedicated actual Redis server; Lua execution against that server remains unverified in this environment.
- Frontend production build: passed. Existing bundle-size warning remains.
- Browser checks: passed at **320px, 390px and 1366px**, covering both operators, empty/wrong answers, attempt exhaustion, refresh, server rejection of expired challenges, automatic client expiry, network recovery, credential-failure reset, OTP transition/back navigation and unchanged invitation/forgot-password scope.
- Widget controls meet 44px height, with no horizontal overflow, JavaScript page errors or Google CAPTCHA requests/elements in the checked layouts.
- Style audit: the CAPTCHA component satisfies the existing Tailwind conventions. The repository-wide `check:styles` command still reports pre-existing ordinary declarations in `admin.tailwind.css` and `secretary.tailwind.css`; those unrelated files were not modified.

# Phase 1 manual checklist: Identity & user management

Setup: `docker compose up -d`, then in `backend/`: `npm run migration:run && npm run seed && npm run dev`; in `frontend/`: `npm run dev`.
With `EMAIL_PROVIDER=console` (default) verification codes are **printed in the API terminal** ("Your CREH verification code is 123456").
Set `RATE_LIMIT_ENABLED=false` in `backend/.env` if you need to repeat the login checks many times.
Curl examples use `B=http://localhost:5000/api`.

Accounts: `test@creh.com` / `test` (already verified), plus fresh self-registered users.

### P1-01 Schema migration
Steps: on a DB that already has Phase 0 data, run `npm run migration:run`. Then `select email, verification_status, location from users;`
Expected: migration succeeds; pre-existing users are `email_verified`; the old placeholder location (-122.4, 37.8) is NULL; tables `email_verifications` and `refresh_tokens` exist. `npm run migration:revert` then `migration:run` also works.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-02a Register -> verify
Steps: register a new user in the UI (password `Passw0rd123`). You land on **Check your email**. Copy the code from the API log, enter it.
Expected: redirected to Settings with a welcome note; header banner "Verify your email" disappears; badge shows **Email verified**.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-02b Wrong / expired / locked codes
Steps: enter `000000`; repeat 5+ times; then use "Send a new code".
Expected: "Incorrect code"; after 5 misses "Too many incorrect attempts"; a new code works. A code older than 15 min (set `VERIFICATION_CODE_TTL_MIN=1` to test) is rejected as expired.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-02c Resend cooldown
Steps: click "Send a new code" twice within a minute.
Expected: second attempt is refused (button shows a countdown; API returns 429). The previous code stops working once a new one is issued.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-02d Unverified users are blocked
Steps: as an unverified user: `POST $B/resources` (valid body) and `POST $B/requests {"resourceId":1}` with their token; also try "Add listing" in the dashboard.
Expected: both API calls -> `403 {"error":"Verify your email address to do that","details":{"code":"EMAIL_NOT_VERIFIED"}}`; the UI shows that message. After verifying, both work. Browsing/discovery still works while unverified.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-03a Refresh rotation
Steps: `POST $B/auth/login` -> note `refreshToken` R1. `POST $B/auth/refresh {"refreshToken":R1}` -> R2. Repeat with R1 again, then with R2.
Expected: first refresh returns a new access + refresh pair; reusing R1 -> 401 "already used"; R2 is now also dead (whole family revoked); user must log in again.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-03b Logout revokes
Steps: login, `POST $B/auth/logout {"refreshToken":R}`, then refresh with R. Also click Logout in the UI.
Expected: logout returns 204; refresh -> 401. UI returns to the home page signed out.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-03c Silent refresh in the browser
Steps: set `JWT_EXPIRES_IN=30s` in `backend/.env`, restart API, log in, wait 40 s, then navigate to Dashboard / click something that calls the API.
Expected: the page keeps working with no redirect to /auth (network tab shows one `401` then `POST /auth/refresh` then the retried call succeeding). Clear `refreshToken` from localStorage and wait again: you are sent to /auth.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-03d Suspended user
Steps: `update users set suspended_at = now() where email = '...';` then call any authed endpoint with their existing token, and try to log in.
Expected: 403 "This account is suspended" for both. Clearing `suspended_at` restores access.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-04 Profile
Steps: Settings -> change name, phone (`+1 555 123 4567`), address, bio, upload an avatar (PNG/JPEG), save. Reload. Try phone `abc`. Remove the avatar.
Expected: values persist across reload; invalid phone is rejected with a message; avatar appears on the settings page; remove works. `GET $B/users/me` never returns `password_hash`.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-05 Home location
Steps: (a) on Settings click the map to drop a pin, drag it, Save location. (b) Click "Use my location" (allow permission) and save. (c) Search an address (needs `MAPBOX_ACCESS_TOKEN` in backend `.env`). (d) `PUT $B/users/me/location {"lat":999,"lng":0}`.
Expected: (a)/(b) saved; reload shows the pin where you left it; `GET /users/me` returns `home_location`. (c) with a token: location + address filled; without one: friendly 503 "Address search is not configured". (d) 400. A freshly registered user has `home_location: null` (no hard-coded San Francisco location).
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-06 Community verification + badge
Steps: as an email-verified user *without* a location submit the form (API: `POST $B/users/me/verify-community {"note":"..."}`); set a location; submit again with a 10+ char note. As unverified user try the API.
Expected: no location -> 400; unverified -> 403; success -> status `community_pending`, badge "Verification pending". To see the final badge, approve manually: `update users set verification_status='community_verified' where email='...'` -> badge "Verified neighbor" (admin approval UI arrives in Phase 7).
Result: [ ] Pass  [ ] Fail   Tester/date:

### P1-07 Rate limits & password policy
Steps: register with `short`, `abcdefghij`, `12345678`, then `Passw0rd123`. Submit 11 wrong logins from one machine in 15 min.
Expected: first three rejected with a clear message (min 8 chars, needs letter and number); 11th failed login -> 429 "Too many attempts". Seeded accounts (`test`/`test`) can still log in (policy applies to registration only).
Result: [ ] Pass  [ ] Fail   Tester/date:

### Exit journey
Steps: register -> receive code -> verify -> set home location -> open profile.
Expected: profile shows your details, location pin and the verification badge, end to end, on desktop and a ~375 px wide window.
Result: [ ] Pass  [ ] Fail   Tester/date:

### Mock fallback (SPEC 7b)
Steps: stop the API while on Settings (dev build) and reload.
Expected: sample profile with an amber **Demo data** badge; save buttons are disabled (writes never fake success).
Result: [ ] Pass  [ ] Fail   Tester/date:

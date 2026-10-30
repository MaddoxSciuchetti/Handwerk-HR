# Personal Microsoft Teams connections

Each app user connects one Microsoft work account per organization under **Settings → Profile → Microsoft Teams**. A Teams task sends as the person clicking Send; it never borrows an assignee’s or administrator’s connection. Existing Outlook sending and channel-email recipients are unchanged.

## Deployment

1. Use Node.js 20 or newer. Install backend dependencies (`npm ci`), generate Prisma (`npm run prisma:generate`), and apply migrations (`npx prisma migrate deploy`) before starting the updated backend. Build/deploy backend and frontend using their existing deployment process.
2. Configure `INTEGRATION_SECRET_KEY` on every backend replica with the same persistent value. Losing/changing it makes encrypted connections unreadable; employees must reconnect. Never place it in frontend variables or Git.
3. Set `MICROSOFT_TEAMS_REDIRECT_URI=https://backendonboarding.onrender.com/auth/microsoft/callback` in production. That URL is the production default, but set it explicitly. Use a separately registered callback for each staging/development backend; local example: `http://localhost:3000/auth/microsoft/callback`. The path must remain `/auth/microsoft/callback`.
4. Set `FRONTEND_URL` to the actual frontend origin. After sign-in the backend redirects to `/settings/profile` there. Keep `APP_ORIGIN` configured for frontend API access. The callback is served by the backend under `/auth`, outside the regular API-session middleware, and authenticates the one-time state and browser binding instead. The binding cookie is HttpOnly, lasts ten minutes and is Secure/SameSite=None in production for cross-site frontend/backend installations.
5. Under organization Integrations settings, enable Microsoft and provide tenant GUID, client GUID and client-secret value. Teams does not require the domain/license SKU provisioning fields. Keep `INTEGRATIONS_LIVE=true` only in environments permitted to send real messages. Connecting/discovery do not send messages.
6. In the existing Entra app registration, register a **Web** redirect URI matching the configured callback exactly. Configure delegated `User.Read`, `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChannelMessage.Send`, `Files.Read.All`, `Sites.Read.All` and `offline_access`; the login also requests `openid`/`profile`. Obtain user or admin consent as required by tenant policy. Existing application permissions do not replace these user permissions. Users who already connected must reconnect once so SharePoint document search receives the new file scopes.
7. Pilot with two employees. Each connects her account, opens a task with **Teams-Nachricht senden**, previews the selected template’s body, selects channels and sends. Verify the Teams author matches the employee and the task completes only after all destinations succeed.

## Sending and failures

Teams task templates reuse an existing message template’s body and employee placeholders. Subject, Outlook sender and mail recipients do not apply. Channels are selected per send and identified by owning team and channel IDs, including accessible shared/private channels. No channel email address is required. Graph ultimately enforces membership, moderation and posting permissions.

Connection metadata and channel/preview caches are user/organization scoped. Token caches and PKCE verifiers are encrypted on the backend. Refreshes are serialized with PostgreSQL transaction advisory locks across replicas. Disconnect removes only the current user’s connection and outstanding sign-in attempts. Disconnect/new sign-in also cancels an authorization exchange already in progress.

Delivery is recorded per destination. Retries preserve the original rendered body, destinations, author and idempotency key. Confirmed successes are not resent. Throttled requests wait for Retry-After. A timeout, interrupted worker or ambiguous response becomes **delivery unknown**: the employee must check the channel in Teams and explicitly mark it arrived or not arrived before retrying. This is not an exactly-once guarantee. A begun delivery cannot be transferred to a different employee or Microsoft identity.

Audit records: `microsoft_connection_events` for connect/disconnect/reconnect, `teams_sends` and `teams_send_destinations` for delivery state, and issue audit entries for delivery attempts, review and completion. Do not log authorization codes, token caches, access tokens or raw MSAL errors.

## Validation

- Backend: `npm test -- --runInBand src/services/microsoftTeams src/services/tasks.automation.test.ts`
- Frontend: `npx vitest run test-unit/microsoft-teams/teams.test.tsx test-unit/settings/profile-fields.test.tsx test-unit/all-tasks/task-automation-form.test.tsx`
- Database concurrency tests are skipped unless `TEAMS_TEST_DATABASE_URL` explicitly points to a migrated, disposable localhost PostgreSQL database named `teams_final`. Run `TEAMS_TEST_DATABASE_URL=postgresql://USER@127.0.0.1:PORT/teams_final npx jest --runInBand test-integration/microsoftTeams.database.test.ts`. The tests create and remove only their own fixture records; never point them at production.
- A live Microsoft sign-in/MFA and the two-person Teams author pilot require real employee participation and are not replaced by mocked Graph tests.

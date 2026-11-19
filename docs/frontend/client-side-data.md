# Client-side data

How state is split in this SPA:

| Kind | Where |
| --- | --- |
| Server/API data (workers, tasks, org, …) | TanStack Query (`client/src/config/query.client.ts`; prefetch notes in [optimization](./optimization.md)) |
| Shareable UI (filters, selected task, invite, return path) | TanStack Router search params (`validateSearch`) |
| Ephemeral UI (modals, local toggles) | React Context or component state — keep Context narrow ([client/decisions](../../client/decisions.md)) |
| Drafts and prefs on device | `localStorage` (below) |
| Access / refresh tokens | `httpOnly` cookies (below) — not React state, not `localStorage` |

## Access and refresh tokens (httpOnly cookies)

Tokens are not kept in React state or `localStorage`. On login / register the API sets two cookies via [`setAuthCookies`](../../server/src/utils/cookies.ts):

| Cookie | Lifetime | Role |
| --- | --- | --- |
| `accessToken` | ~15 minutes | Sent on every authenticated API call; middleware verifies it |
| `refreshToken` | ~30 days | Used only to mint a new access cookie (`GET /auth/v2/refresh`) |

Both are `httpOnly` + `sameSite: "lax"` (`secure` outside development), so normal page JavaScript cannot read them. Axios uses `withCredentials: true`; on 401 `InvalidAccessToken` the client interceptor refreshes and retries. Full flow: [authentication](../backend/authentication.md).

## URL search params (shareable links)

UI that another person (or you later) should open in the same place goes in TanStack Router search params, not only in component state. Copy the link and the filters / selected task / invite still apply.

Example from `client/src/routes/user/$Id.tsx`:

```ts
validateSearch: (
  search: Record<string, unknown>
): {
  workerName: string;
  prevPage: string;
  taskId?: string;
} => ({
  workerName: (search.workerName as string) || '',
  prevPage: (search.prevPage as string) || '',
  taskId: typeof search.taskId === 'string' ? search.taskId : undefined,
}),
```

A link like `/user/<id>?workerName=Ada&prevPage=/workers&taskId=<taskId>` opens that worker with the same task context. Same idea for signup `?invite=…`, document return `?returnContract=1`, and template `?name=…`.

## Questionnaire answer drafts (`localStorage`)

When someone fills the public questionnaire (`fragebogen`), answers are drafted on the device so a reload does not wipe the form. Code: `client/src/features/questionnaire/questionnaireAnswerDraft.ts`.

Key shape: `fragebogen-answers:v1:<token>` (one draft per questionnaire invite token).

Value shape:

```ts
type QuestionnaireAnswerDraft = {
  values: Record<string, string>;
  rows: Record<string, Record<string, string>[]>;
};
```

Rough usage:

```ts
import {
  readAnswerDraft,
  writeAnswerDraft,
  clearAnswerDraft,
} from "@/features/questionnaire/questionnaireAnswerDraft";

// restore after load
const draft = readAnswerDraft(token);

// save while editing
writeAnswerDraft(token, {
  values: { firstName: "Ada", … },
  rows: { /* repeatable section rows */ },
});

// after successful submit
clearAnswerDraft(token);
```

`writeAnswerDraft` JSON-stringifies into `localStorage`. Read parses and validates the shape; bad JSON is ignored. If the browser blocks storage, write fails quietly so the form still works for that session.

## Other prefs on device (same idea)

| What | Where |
| --- | --- |
| Theme (light/dark) | theme provider + `localStorage` |
| Worker table columns / filters | `useWorkerTablePrefs`, `useWorkerFilter` |
| Task phase UI | `taskPhaseStorage.ts` |
| Seen mention notices | `MentionNotice.tsx` |

These are UI preferences or drafts, not the source of truth for workers, tasks, or billing. Server data stays in TanStack Query.

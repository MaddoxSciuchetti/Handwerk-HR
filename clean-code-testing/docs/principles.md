Below are clean code principles followed in this project:

## DRY

Instead of passing each item individually I can create a variable containing an array with all the items I want to pass. I can then pass these items by mapping over them. The function that receives items can map over the items and display them. This reduces the pain of having to write every item.

### Example 1: Sidebar items

`[client/src/components/ui/sidebar/AppSidebar.tsx](client/src/components/ui/sidebar/AppSidebar.tsx)`

```tsx
<SideBarMenu
    collapsed={isCollapsed}
    items={LAYOUTITEMS.map((item) => ({
        id: item.to,
        label: item.title,
        icon: item.icon,
        to: item.to,
        disabled: subscriptionLocked,
        search:
            item.to === "/org-settings"
                ? { currentTab: "employees" }
                : undefined,
    }))}
/>
```

`[client/src/constants/layout.consts.ts](client/src/constants/layout.consts.ts)`

```ts
export const LAYOUTITEMS = [
    {
        title: "Handwerker",
        to: "/worker-lifycycle",
        icon: Inbox,
    },
    {
        title: "Aufgaben",
        to: "/tasks",
        icon: Ticket,
    },
];
```

### Example 2: Reusable form field

`[client/src/components/form/FormFields.tsx](client/src/components/form/FormFields.tsx)`

Below shows a generic TypeScript component. Instead of defining the label, input and error message there is one single component taking in all the arguments that can be reused over and over again.

First the arguments are defined and made generic:

```ts
type FormFieldsProps<TFieldValues extends FieldValues> = Omit<
    ComponentProps<"input">,
    "name"
> & {
    errors: FieldErrors<TFieldValues>;
    register: UseFormRegister<TFieldValues>;
    name: Path<TFieldValues>;
    placeholder?: string;
    label?: string;
    labelClassName?: string;
    type?: string;
    required?: boolean;
};
```

Then we implement the function body containing the label, input and error message:

```tsx
const FormFields = <TFieldValues extends FieldValues>({
    errors,
    register,
    label,
    labelClassName,
    name,
    className,
    id,
    ...props
}: FormFieldsProps<TFieldValues>) => {
    return (
        <div className="flex min-w-0 flex-col gap-3">
            {label && (
                <Label
                    htmlFor={id}
                    className={cn("ds-label-base", labelClassName)}
                >
                    {label}
                </Label>
            )}
            <Input
                className={cn("rounded-xl", className)}
                id={id}
                {...props}
                {...register(name)}
            />
            <ErrorMessage
                errors={errors}
                name={name as unknown as never}
                render={({ message }) => (
                    <p className="text-sm text-(--destructive)">{message}</p>
                )}
            />
        </div>
    );
};
```

## KISS

### Example 1: Task mutations in one object

`[client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts](client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts)`

This is keeping it simple and stupid as my mutation options are all stored in one mutation object. Whenever I want to use any of the mutations I can just access the property on the object.

```ts
export const taskMutations = {
    createTask: () =>
        mutationOptions<unknown, Error, unknown>({
            mutationFn: (payload: unknown) => createTask(payload),
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: [FETCHDESCRIPTION],
                });
            },
        }),

    updateTask: () =>
        mutationOptions<unknown, Error, UpdateTaskParams>({
            mutationFn: ({ taskId, data }) => updateTask({ taskId, data }),
            onSuccess: (_, { taskId }) => {
                void queryClient.invalidateQueries({
                    queryKey: [FETCHDESCRIPTION],
                });
                void queryClient.invalidateQueries({
                    queryKey: [TASKHISTORY, taskId],
                });
            },
        }),
};
```

### Example 2: Task history hook

`[client/src/features/worker-task-management/hooks/useGetTaskHistory.ts](client/src/features/worker-task-management/hooks/useGetTaskHistory.ts)`

Below shows a simple hook that is only responsible for fetching the data and then returning the data and a few options returned by `useQuery`.

```ts
export const useGetTaskHistory = (taskId: string) => {
    const { data, isLoading, error, refetch } = useQuery(
        workerQueries.getTaskHistory(taskId),
    );

    return {
        historyData: data,
        isLoading,
        error,
        refetchHistory: refetch,
    };
};
```

### Example 3: Worker routes

`[server/src/routes/worker.route.ts](server/src/routes/worker.route.ts)`

The file only contains the route and the controller.

```ts
worker.post("/", workerController.createWorker);
worker.get("/", workerController.getWorkerData);
worker.get("/:workerId", workerController.getWorkerById);
worker.put("/:workerId", workerController.updateWorker);
worker.delete("/:workerId", workerController.deleteWorker);
```

## YAGNI

### Example 1: HTTP status constants

`[client/src/constants/http.consts.ts](client/src/constants/http.consts.ts)`

```ts
export const UNAUTHORIZED = 401;
export const FORBIDDEN = 403;
```

Only having status codes that are being used in the client application. If further status codes are needed only then should they be added.

### Example 2: Minimal query client config

`[client/src/config/query.client.ts](client/src/config/query.client.ts)`

The below code builds a single global query client and only disables query retries. It does not persist cache or set a default staleTime strategy as this is currently not needed in the code. It also follows the clean code principle of preventing over-configurability.

```ts
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});
```

### Example 3: Payment redirect message

`[client/src/features/settings/payments/PaymentRedirectMessage.tsx](client/src/features/settings/payments/PaymentRedirectMessage.tsx)`

Below only shows the message. There are no icons or variants as this too is not needed for the current requirements.

```tsx
export function PaymentRedirectMessage({
    message,
}: PaymentRedirectMessageProps) {
    return (
        <section className="flex w-full max-w-md flex-col">
            <p className="typo-body text-card-foreground">{message}</p>
        </section>
    );
}
```

## Error handling

See below one pattern used in the /client directory

```ts
export async function tryCatch<T, E = Error>(
    promise: Promise<T>,
): Promise<Result<T, E>> {
    try {
        const data = await promise;
        return [data, null] as const;
    } catch (error) {
        return [null, error as E] as const;
    }
}
```

**Avoid** — repeating manual blocks when you only need “await, then bail on failure” (easy to leave empty `catch`, duplicate noise):

```ts
try {
    await doThing();
} catch {
    return;
}
```

See below one pattern used in the /server directory

The wrapper is applied before the controller. The error is being handled by the express middleware

```ts
const catchErrors =
    (controller: AsyncController): AsyncController =>
    async (req, res, next) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            next(error);
        }
    };
```

Usage pattern: `[server/src/controllers/template.controller.ts](server/src/controllers/template.controller.ts)` — e.g. `export const createTemplate = catchErrors(async (req, res) => { ... })`.

---

### Understandability Principles

- Be consistent. If you do something a certain way, do all similar things in the same way.

The above principle is found in various places in my codebase.

Below is one example where the API calls are always in the same file per feature and always follow the same shape:

`[client/src/features/all-tasks/api/tasks.api.ts](client/src/features/all-tasks/api/tasks.api.ts)`

```ts
export const getTasks = async (): Promise<IssueResponse[]> => {
    return API.get(`/tasks/`);
};

export const createTask = async (payload: unknown): Promise<unknown> => {
    return API.post(`/tasks/`, payload);
};
export const updateTask = async ({
    taskId,
    data,
}: UpdateTaskParams): Promise<unknown> => {
    return API.patch(`/tasks/${taskId}`, data);
};
```

- Use explanatory variables.

### Example: Task sidebar naming

`[client/src/features/all-tasks/components/TaskSidebar.tsx](client/src/features/all-tasks/components/TaskSidebar.tsx)`

The variable naming correlates to the responsibility of the variable.

```tsx
const [commentText, setCommentText] = useState("");
const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
const saveComment = useSaveTaskComment();
```

- Encapsulate boundary conditions. Boundary conditions are hard to keep track of. Put the processing for them in one place.

`[client/src/config/env.ts](client/src/config/env.ts)`

Ensures that env vars are either defined or if not defined an error is thrown.

```ts
export const getEnv = (key: string, defaultValue?: string): string => {
    const value = runtimeEnv[key] ?? defaultValue;

    if (value === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
};
```

### Names principles

- Choose descriptive and unambiguous names.

`[client/src/config/apiClient.ts](client/src/config/apiClient.ts)`

```ts
const isInvalidAccessToken = (status: number, data: ApiErrorResponse) =>
    status === UNAUTHORIZED && data?.errorCode === "InvalidAccessToken";

const isSubscriptionAccessDenied = (status: number, data: ApiErrorResponse) =>
    status === FORBIDDEN && data?.errorCode === "SubscriptionAccessDenied";
```

- Make meaningful distinction.

`[client/src/features/settings/payments/util/subscriptionAccess.util.ts](client/src/features/settings/payments/util/subscriptionAccess.util.ts)`

```ts
export function hasStripeManagedSubscription(
    s: BillingSubscription | null | undefined,
): boolean {
    // ...
}
export function hasSubscriptionAppAccess(
    s: BillingSubscription | null | undefined,
): boolean {
    // ...
}
export function isSubscriptionLocked(
    s: BillingSubscription | null | undefined,
): boolean {
    return !hasSubscriptionAppAccess(s);
}
```

- Use pronounceable names.

`[client/src/features/settings/payments/util/trial.util.ts](client/src/features/settings/payments/util/trial.util.ts)`

```ts
export function trialDaysRemainingLabel(
    trialEndsAt: string | null,
): string | null {
    const days = trialDaysRemaining(trialEndsAt);
    if (days === null) return null;
    if (days === 0)
        return "Letzter Tag der Testphase — bitte wähle einen Plan.";
    if (days === 1) return "Noch 1 Tag in der Testphase.";
    return `Noch ${days} Tage in der Testphase.`;
}
```

- Use searchable names.

`[client/src/features/all-tasks/api/tasks.api.ts](client/src/features/all-tasks/api/tasks.api.ts)` contains searchable names such as `getTasks` or `createTask`.

- Replace magic numbers with named constants.

`[client/src/constants/http.consts.ts](client/src/constants/http.consts.ts)`

```ts
export const UNAUTHORIZED = 401;
export const FORBIDDEN = 403;
```

### Functions Principles

- Small.

Trial days remaining is a short focused calculation (input → number / `null`).

`[client/src/features/settings/payments/util/trial.util.ts](client/src/features/settings/payments/util/trial.util.ts)`

```ts
export function trialDaysRemaining(trialEndsAt: string | null): number | null {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt).getTime();
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / MS_PER_DAY);
}
```

- Do one thing.

Only answers the question if this organization can use the app.

`[client/src/features/settings/payments/util/subscriptionAccess.util.ts](client/src/features/settings/payments/util/subscriptionAccess.util.ts)`

```ts
export function hasSubscriptionAppAccess(
    s: BillingSubscription | null | undefined,
): boolean {
    if (!s) return true;
    if (s.status === "cancelled") return false;
    if (s.status === "past_due") return false;
    if (s.status === "active") return true;
    if (s.status === "trialing" && s.stripeSubscriptionId) return true;
    if (s.status === "trialing" && !s.stripeSubscriptionId) {
        if (!s.trialEndsAt) return true;
        return new Date(s.trialEndsAt) > new Date();
    }
    return false;
}
```

- Prefer fewer arguments.

`[client/src/features/all-tasks/api/tasks.api.ts](client/src/features/all-tasks/api/tasks.api.ts)` takes a single object instead of many positional parameters, reducing risk of wrong argument order.

```ts
export const saveTaskComment = async ({
    taskId,
    body,
    commentId,
}: SaveTaskCommentParams): Promise<unknown> => {
    return API.post(`/tasks/${taskId}/comments`, {
        body,
        ...(commentId ? { commentId } : {}),
    });
};
```

- Have no side effects.

`[client/src/features/settings/payments/util/trial.util.ts](client/src/features/settings/payments/util/trial.util.ts)`

Does not contain any side effects (aside from reading the current time via `Date`).

```ts
export function trialDaysRemaining(trialEndsAt: string | null): number | null {
    if (!trialEndsAt) return null;
    const end = new Date(trialEndsAt).getTime();
    if (Number.isNaN(end)) return null;
    const diff = end - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / MS_PER_DAY);
}
```

### Comments rules

- Always try to explain yourself in code.
- Don't be redundant.
- Don't add obvious noise.
- Don't use closing brace comments.
- Don't comment out code. Just remove.
- Use as explanation of intent.
- Use as clarification of code.
- Use as warning of consequences.

To give one clear example that follows the above criteria view this file `[client/src/config/apiClient.ts](client/src/config/apiClient.ts)`.

The comment clarifies the code as it is not clear why two axios flows run (refresh then retry):

```ts
//  * Second axios client (not `API`). It does not use the error handler on `API` below.
//  * Refresh and retry run here so they cannot fire that handler again and loop forever.

const TokenRefreshClient = axios.create(options);
```

### Source code structure

- Separate concepts vertically.

Different layers live in different files/folders. The backend architecture follows server → route → controller → service.

- Related code should appear vertically dense.

`[client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts](client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts)`

Keeps each mutation's `mutationFn` and its `onSuccess` invalidations together so one screen shows the whole behaviour of that specific action.

- Declare variables close to their usage.

`[client/src/config/apiClient.ts](client/src/config/apiClient.ts)`

The `config`/`response` are taken from the error and are also being used directly after.

```ts
const { config, response } = error;
if (!config) {
    throw new Error("config is not defined");
}
if (!response) {
    throw new Error("response is not ok");
}
```

- Dependent functions should be close. `[client/src/config/apiClient.ts](client/src/config/apiClient.ts)`
- Similar functions should be close. `[client/src/features/all-tasks/api/tasks.api.ts](client/src/features/all-tasks/api/tasks.api.ts)`
- Place functions in the downward direction. `[client/src/features/template-tasks/components/template-items/TemplateTasks.tsx](client/src/features/template-tasks/components/template-items/TemplateTasks.tsx)`
- Keep lines short. `[client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts](client/src/features/all-tasks/query-options/mutations/tasks.mutations.ts)`
- Don't break indentation: TS/TSX in `client/src` uses consistent 2-space indentation.

### Objects and data structures

- Hide internal structure. `[client/src/features/all-tasks/components/TaskCommentBox.tsx](client/src/features/all-tasks/components/TaskCommentBox.tsx)`

The callers pass the props and callbacks. They don't reach into a component's private state.

- Prefer data structures. `[client/src/features/settings/payments/payments.consts.ts](client/src/features/settings/payments/payments.consts.ts)`

Plain objects are used as shown below:

```ts
export const PAYMENT_PLANS: readonly PaymentPlan[] = [
    {
        id: "starter",
        name: "Starter",
        price: "10 € / Monat",
        priceId: "price_1TSLW4IFABFY32sSl8hcCUBE",
    },
    {
        id: "pro",
        name: "Pro",
        price: "30 € / Monat",
        priceId: "price_1TSekYIFABFY32sSYamWuX2h",
    },
    {
        id: "enterprise",
        name: "Enterprise",
        price: "Auf Anfrage",
        priceId: "price_1TSekYIFABFY32sS3XsLPgIW",
    },
] as const;
```

- Should be small. `[client/src/components/form/SingleFormField.tsx](client/src/components/form/SingleFormField.tsx)`

Shows a small component.

- Do one thing. `[client/src/components/form/SingleFormField.tsx](client/src/components/form/SingleFormField.tsx)`

Shows the same component doing only one thing.

- Better to have many functions than to pass some code into a function to select a behavior. `[client/src/features/all-tasks/api/tasks.api.ts](client/src/features/all-tasks/api/tasks.api.ts)`

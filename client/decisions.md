The following describes decisions done in this project:

Implementation:
Reason:
Alternatives:

Implementation: Usecontext for handling modalstate
Reason: modalstate is spread over multiple components that are still related to one another
Alternatives: Zustand or Redux

Implementation: Keep React Context narrow (theme, local UI); put server state in TanStack Query
Reason: Context re-renders its consumers when the value changes. A large app-wide Context would cause avoidable work. Theme and small feature UI stay in Context; API data stays in Query. Example theme provider: `client/src/context/theme-provider/ThemeProvider.tsx`. Performance write-up: `docs/optimization-deep-dive.md` (Architecture choices that also optimize).
Alternatives: Zustand or Redux for fine-grained client state if a feature outgrows Context

Implementation: Pagination not server side
Reason: The data being fetched amounts to avg 10-20 tasks
Alternatives: Pagination through the server

---

Decided to go with RHF because of its ease of use in implementing it. Due to preference i do not like the useForm from tanstack that lets you bind components directly to the form. RHF allows more flexibility.

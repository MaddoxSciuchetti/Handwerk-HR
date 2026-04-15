The following describes decisions done in this project:

Implementation:
Reason:
Alternatives:

Implementation: Usecontext for handling modalstate
Reason: modalstate is spread over multiple components that are still related to one another
Alternatives: Zustand or Redux

Implementation: Pagination not server side
Reason: The data being fetched amounts to avg 10-20 tasks
Alternatives: Pagination through the server

---

Decided to go with RHF because of its ease of use in implementing it. Due to preference i do not like the useForm from tanstack that lets you bind components directly to the form. RHF allows more flexibility.

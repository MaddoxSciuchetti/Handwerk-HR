# Architecture decisions

These are the big choices behind the backend. Folder layout and naming are in [decisions.md](../clean-code-testing/decisions.md). Where it runs is in [hosting.md](./hosting.md).

Decision: Keep the product as one monolith — one React client, one Express API, one Postgres — not microservices.

Reason: Onboarding, tasks, documents, and billing are one product. Cutting that into many services would mean more deploys, more networking, and more things that can break, for a team that is still small. Client and server stay in separate folders so people can work on UI and API without stepping on each other. The backend does not have to stay Express forever; a new person could rewrite it (for example in Java) without touching the client.

Decision: Use TypeScript on the server (and on the client).

Reason: Type safety is a must have in javascript applications to ensure run-time safetey. Furthermore can i write it on both sides. Other options would have included Python, Go or Java. However this would have required me to learn another language from the ground up without the headstart that i already had with web development

Decision: Express for the API

Reason: The first tutorials and videos I followed all used Express, so it was the natural starting point and easy to learn. It stays simple: we control routes, middleware, and the route → controller → service split ourselves. Other options could have been Nest, Fastify or Hono (the two last being more modern). Hono can become an interesting choise in the future when i want more speed etc. More options could have been Nextjs or Tanstack Start. I did not choose those as I want a clear split between the client and backend.

Decision: Use Postgres as the database.

Reason: Almost all of the data is related (orgs, workers, engagements, issues, document metadata, billing). That fits tables and foreign keys well. A document store would fight that shape. Files that are just blobs (images, PDFs, and similar) do not belong in Postgres; those go to object storage (AWS) as a dump for important files the app links to.

Decision: Use Prisma as the ORM.

Reason: I can read Prisma’s syntax much better than writing a lot of raw SQL by hand. Other ORMs were an option — for example Drizzle — but that style sits closer to SQL and does not fit how I want to work in this app. Prisma also sits next to our schema and migrations and works well with TypeScript and the migrate step on Render.

Decision: The SPA talks to the API with HTTP JSON and cookies. No GraphQL or gRPC.

Reason: Client and backend stay separate apps, so they need a clear boundary. The browser calls the API over HTTP, sends and gets JSON, and keeps the session in cookies. That is enough for this product: one SPA, one API, Zod on the server for bodies. GraphQL or gRPC would add more moving parts between client and backend without a strong reason right now.

Decision: Sign-in is email and password with our own JWT cookies. No “Log in with Google” (or other social / OAuth IdPs).

Reason: Not every user has a Google (or similar) account, so that login path would lock some people out. We also do not want the product tied to third-party identity apps for security: fewer external connections, no OAuth client secrets to babysit, and the session stays under our cookies only. How that cookie flow works is in [authentication.md](./authentication.md).

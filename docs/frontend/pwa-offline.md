# PWA and offline

We do not ship a service worker, offline mode, or an installable Progressive Web App. The SPA needs the API for real work: a cached worker screen without the network still cannot create or upload tasks.

Offline would only pay off if we later built a real sync path (local drafts + outbox + conflict handling) for bad-signal field use. Until that is a product goal, skip it.

We also reject making the site “look like a native app” (home-screen install / standalone window). Our users already work in the browser with a tab or bookmark; an install prompt does not change the product and adds another shell to maintain.

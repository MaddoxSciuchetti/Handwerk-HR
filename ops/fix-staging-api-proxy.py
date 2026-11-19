#!/usr/bin/env python3
"""Make staging SPA auth same-origin (match production).

onrender.com is on the Public Suffix List, so the staging frontend and API
subdomains are different sites. SameSite=Lax session cookies set by the API
are not sent on XHR from the frontend unless requests stay same-origin via
a /api rewrite (as production already does).

Requires RENDER_API_KEY. Idempotent: keeps an existing identical rewrite at
priority 0 (ahead of any SPA fallback) and only updates VITE_API_URL when it
is not already /api.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

API = "https://api.render.com/v1"
KEY = os.environ.get("RENDER_API_KEY")
if not KEY:
    sys.exit("Set RENDER_API_KEY before running this script.")

# Known staging API service (see ops/configure-*-cron.py).
STAGING_API_SERVICE_ID = "srv-d6dnk2vpm1nc739v1m90"
FRONTEND_NAME_HINTS = (
    "bsb-onboarding-frontend-staging",
    "frontend-staging",
)
REWRITE_SOURCE = "/api/*"
API_ENV_KEY = "VITE_API_URL"
API_ENV_VALUE = "/api"


def request(path: str, method: str = "GET", body: dict | None = None):
    req = urllib.request.Request(
        API + path,
        method=method,
        headers={
            "Authorization": f"Bearer {KEY}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Handwerk-HR-staging-api-proxy",
        },
        data=json.dumps(body).encode() if body is not None else None,
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            raw = response.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(
            f"Render {method} {path}: HTTP {error.code}: {detail}"
        ) from None


def service_payload(entry):
    if isinstance(entry, dict) and "service" in entry:
        return entry["service"]
    return entry


def list_paginated(path: str, wrapper_key: str | None = None):
    """Fetch every page from a Render list endpoint (default page size is 20)."""
    items = []
    cursor = None
    while True:
        page_path = f"{path}{'&' if '?' in path else '?'}limit=100"
        if cursor:
            page_path += f"&cursor={cursor}"
        page = request(page_path) or []
        if not page:
            break
        for entry in page:
            if wrapper_key and isinstance(entry, dict) and wrapper_key in entry:
                items.append(entry[wrapper_key])
            else:
                items.append(service_payload(entry) if wrapper_key is None else entry)
        if len(page) < 100:
            break
        cursor = page[-1].get("cursor")
        if not cursor and wrapper_key and isinstance(page[-1], dict):
            nested = page[-1].get(wrapper_key) or {}
            cursor = nested.get("id")
        if not cursor:
            cursor = service_payload(page[-1]).get("id")
        if not cursor:
            break
    return items


def list_all_services():
    return list_paginated("/services")


def find_frontend(services, api_service):
    owner_id = api_service.get("ownerId")
    for service in services:
        if service.get("ownerId") != owner_id:
            continue
        name = (service.get("name") or "").lower()
        if any(hint in name for hint in FRONTEND_NAME_HINTS):
            return service
        details = service.get("serviceDetails") or {}
        url = (details.get("url") or "").lower()
        if "frontend-staging" in url or "frontend_staging" in url:
            return service
    raise RuntimeError(
        "Could not find staging frontend service. "
        "Expected a name containing bsb-onboarding-frontend-staging."
    )


def ensure_rewrite(frontend_id: str, backend_url: str):
    destination = backend_url.rstrip("/") + "/*"
    routes = list_paginated(f"/services/{frontend_id}/routes", wrapper_key="route")
    for item in routes:
        if (
            item.get("type") == "rewrite"
            and item.get("source") == REWRITE_SOURCE
            and item.get("destination") == destination
        ):
            route_id = item.get("id")
            priority = item.get("priority")
            if route_id is not None and priority != 0:
                # SPA /* → /index.html must not win first for /api/*.
                updated = request(
                    f"/services/{frontend_id}/routes/{route_id}",
                    "PATCH",
                    {"priority": 0},
                )
                print(
                    f"moved existing rewrite to priority 0: "
                    f"{REWRITE_SOURCE} -> {destination} (was {priority})"
                )
                return updated.get("headers", updated) if isinstance(updated, dict) else updated
            print(
                f"rewrite already present at priority 0: "
                f"{REWRITE_SOURCE} -> {destination}"
            )
            return item
    created = request(
        f"/services/{frontend_id}/routes",
        "POST",
        {
            "type": "rewrite",
            "source": REWRITE_SOURCE,
            "destination": destination,
            "priority": 0,
        },
    )
    print(f"created rewrite: {REWRITE_SOURCE} -> {destination}")
    return created


def ensure_vite_api_url(frontend_id: str):
    env_vars = list_paginated(
        f"/services/{frontend_id}/env-vars", wrapper_key="envVar"
    )
    current = None
    for env in env_vars:
        if env.get("key") == API_ENV_KEY:
            current = env.get("value")
            break
    if current == API_ENV_VALUE:
        print(f"{API_ENV_KEY} already {API_ENV_VALUE!r}")
        return False
    request(
        f"/services/{frontend_id}/env-vars/{API_ENV_KEY}",
        "PUT",
        {"value": API_ENV_VALUE},
    )
    print(f"set {API_ENV_KEY}={API_ENV_VALUE!r} (was {current!r})")
    return True


def trigger_deploy(frontend_id: str):
    deploy = request(
        f"/services/{frontend_id}/deploys",
        "POST",
        {"clearCache": "clear"},
    )
    deploy_id = (deploy or {}).get("id") or (deploy or {}).get("deploy", {}).get(
        "id"
    )
    print(f"triggered deploy clear-cache: {deploy_id or deploy}")


def main():
    api_service = request(f"/services/{STAGING_API_SERVICE_ID}")
    api_service = service_payload(api_service)
    backend_url = (api_service.get("serviceDetails") or {}).get("url")
    if not backend_url:
        raise RuntimeError("Staging API service has no public URL")

    services = list_all_services()
    frontend = find_frontend(services, api_service)
    frontend_id = frontend["id"]
    frontend_url = (frontend.get("serviceDetails") or {}).get("url")
    print(f"API: {backend_url} ({STAGING_API_SERVICE_ID})")
    print(f"Frontend: {frontend_url} ({frontend_id})")

    ensure_rewrite(frontend_id, backend_url)
    changed_env = ensure_vite_api_url(frontend_id)
    if changed_env:
        trigger_deploy(frontend_id)
    else:
        print("No env change; rewrite is live without redeploy.")
        print(
            "If the built bundle still embeds an absolute API URL, trigger a "
            "manual clear-cache deploy of the frontend."
        )


if __name__ == "__main__":
    main()

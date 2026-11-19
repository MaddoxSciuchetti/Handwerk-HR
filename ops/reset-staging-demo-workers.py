#!/usr/bin/env python3
"""Replace all staging Handwerker with the demo roster (real German names).

Uses the staging skip-login session. Does not touch the admin login user.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

FE = "https://bsb-onboarding-frontend-staging.onrender.com"

# Keep in sync with server/src/prisma/team-roster.ts DEMO_WORKERS.
DEMO_WORKERS = [
    {"firstName": "Anna", "lastName": "Schneider", "birthday": "1991-03-12", "entryDate": "2019-04-01", "position": "Projektleitung", "engagementType": "transfer"},
    {"firstName": "Lukas", "lastName": "Becker", "birthday": "1988-07-22", "entryDate": "2016-09-01", "position": "Elektriker", "engagementType": "transfer"},
    {"firstName": "Julia", "lastName": "Hoffmann", "birthday": "1995-11-04", "entryDate": "2021-02-15", "position": "Bürokauffrau", "engagementType": "transfer"},
    {"firstName": "Markus", "lastName": "Weber", "birthday": "1982-01-30", "entryDate": "2012-06-01", "position": "Meister Sanitär", "engagementType": "transfer"},
    {"firstName": "Sophie", "lastName": "Fischer", "birthday": "1997-05-18", "entryDate": "2023-08-01", "position": "Malerin", "engagementType": "transfer"},
    {"firstName": "Tim", "lastName": "Neumann", "birthday": "1993-09-09", "entryDate": "2018-03-12", "position": "Tischler", "engagementType": "transfer"},
    {"firstName": "Laura", "lastName": "Schäfer", "birthday": "1990-12-02", "entryDate": "2017-10-01", "position": "Disponentin", "engagementType": "transfer"},
    {"firstName": "Jonas", "lastName": "Wagner", "birthday": "1986-04-25", "entryDate": "2014-01-15", "position": "Dachdecker", "engagementType": "transfer"},
    {"firstName": "Nina", "lastName": "Koch", "birthday": "1999-08-14", "entryDate": "2024-05-02", "position": "Azubi Elektro", "engagementType": "transfer"},
    {"firstName": "Felix", "lastName": "Bauer", "birthday": "1984-02-08", "entryDate": "2011-11-01", "position": "Monteur", "engagementType": "transfer"},
    {"firstName": "Claudia", "lastName": "Richter", "birthday": "1979-06-27", "entryDate": "2009-03-01", "position": "Personal", "engagementType": "transfer"},
    {"firstName": "Tobias", "lastName": "Klein", "birthday": "1992-10-19", "entryDate": "2020-07-01", "position": "SHK-Installateur", "engagementType": "transfer"},
    {"firstName": "Emma", "lastName": "Braun", "birthday": "2001-01-16", "entryDate": "2026-11-01", "position": "Elektrikerin", "engagementType": "onboarding"},
    {"firstName": "Paul", "lastName": "Zimmermann", "birthday": "2003-04-03", "entryDate": "2026-12-01", "position": "Azubi Tischler", "engagementType": "onboarding"},
    {"firstName": "Leon", "lastName": "Hartmann", "birthday": "1996-09-21", "entryDate": "2026-10-15", "position": "Monteur", "engagementType": "onboarding"},
    {"firstName": "Sarah", "lastName": "König", "birthday": "1989-05-11", "entryDate": "2018-01-08", "exitDate": "2026-12-31", "position": "Malermeisterin", "engagementType": "offboarding"},
    {"firstName": "David", "lastName": "Lehmann", "birthday": "1985-12-29", "entryDate": "2013-04-01", "exitDate": "2026-11-30", "position": "Fahrer", "engagementType": "offboarding"},
]


def slug(value: str) -> str:
    import unicodedata

    normalized = unicodedata.normalize("NFD", value)
    stripped = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
    return "".join(ch for ch in stripped.lower() if ch.isalnum())


def email_for(first: str, last: str) -> str:
    return f"{slug(first)}.{slug(last)}@demo.invalid"


def iso_date(value: str | None) -> str | None:
    if not value:
        return None
    if "T" in value:
        return value
    return f"{value}T00:00:00.000Z"


class Api:
    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.jar = CookieJar()
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self.jar)
        )

    def request(self, method: str, path: str, body: dict | None = None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(
            f"{self.base}{path}",
            data=data,
            method=method,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": self.base,
            },
        )
        try:
            with self.opener.open(req, timeout=60) as resp:
                raw = resp.read().decode()
                payload = json.loads(raw) if raw else None
                return resp.status, payload
        except urllib.error.HTTPError as exc:
            raw = exc.read().decode()
            try:
                payload = json.loads(raw) if raw else None
            except json.JSONDecodeError:
                payload = {"raw": raw[:500]}
            return exc.code, payload


def main() -> int:
    api = Api(FE)
    status, session = api.request("POST", "/api/auth/v2/staging-session", {})
    if status != 200:
        print(f"staging-session failed: {status} {session}", file=sys.stderr)
        return 1

    status, me = api.request("GET", "/api/user/v2")
    if status != 200 or not isinstance(me, dict) or "id" not in me:
        print(f"user lookup failed: {status} {me}", file=sys.stderr)
        return 1
    admin_id = me["id"]
    print(f"signed in as {me.get('email')} ({admin_id})")

    # includeArchived=true so a full reset also clears archived Handwerker.
    status, workers_payload = api.request(
        "GET", "/api/worker?includeArchived=true"
    )
    if status != 200 or not isinstance(workers_payload, dict):
        print(f"list workers failed: {status} {workers_payload}", file=sys.stderr)
        return 1
    workers = workers_payload.get("data") or []
    ids = [w["id"] for w in workers if isinstance(w, dict) and w.get("id")]
    print(f"deleting {len(ids)} existing workers…")
    if ids:
        # bulk-delete in chunks
        for i in range(0, len(ids), 50):
            chunk = ids[i : i + 50]
            status, result = api.request(
                "POST", "/api/worker/bulk-delete", {"workerIds": chunk}
            )
            if status not in (200, 201, 204):
                print(f"bulk-delete failed: {status} {result}", file=sys.stderr)
                return 1

    created = 0
    for person in DEMO_WORKERS:
        body = {
            "firstName": person["firstName"],
            "lastName": person["lastName"],
            "email": email_for(person["firstName"], person["lastName"]),
            "birthday": iso_date(person.get("birthday")),
            "position": person.get("position"),
            "entryDate": iso_date(person.get("entryDate")),
            "exitDate": iso_date(person.get("exitDate")),
            "engagementType": person["engagementType"],
            "responsibleUserId": admin_id,
            "startDate": iso_date(person.get("entryDate")),
            "endDate": iso_date(person.get("exitDate")),
        }
        # Drop null optional fields so Prisma does not see invalid Date("").
        body = {k: v for k, v in body.items() if v is not None}
        status, result = api.request("POST", "/api/worker", body)
        if status not in (200, 201):
            print(
                f"create failed for {person['firstName']} {person['lastName']}: {status} {result}",
                file=sys.stderr,
            )
            return 1
        # Match seed semantics: Team engagements are completed.
        if person["engagementType"] == "transfer":
            data = (result or {}).get("data") or {}
            worker = data.get("worker") or {}
            engagement = data.get("engagement") or {}
            wid, eid = worker.get("id"), engagement.get("id")
            if wid and eid:
                api.request(
                    "PUT",
                    f"/api/worker/{wid}/engagements/{eid}",
                    {"status": "completed"},
                )
        created += 1
        print(
            f"  + {person['firstName']} {person['lastName']} ({person['engagementType']})"
        )

    status, workers_payload = api.request("GET", "/api/worker")
    workers = (workers_payload or {}).get("data") or []
    from collections import Counter

    counts = Counter(
        ((w.get("engagements") or [{}])[0].get("type") or "?") for w in workers
    )
    print(f"done. created={created} remaining={len(workers)} by type={dict(counts)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

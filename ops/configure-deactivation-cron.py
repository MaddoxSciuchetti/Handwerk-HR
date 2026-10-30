#!/usr/bin/env python3
"""Configure separate Render cron services without deploying the application.

RENDER_API_KEY must be provided by the caller. Jobs are created disabled and
suspended; resume them only after deploying the endpoint and migration.
"""
import json
import os
import secrets
from pathlib import Path
import urllib.request
import urllib.error

API = "https://api.render.com/v1"
KEY = os.environ["RENDER_API_KEY"]
TARGETS = {
    "staging": "srv-d6dnk2vpm1nc739v1m90",
    "production": "srv-d65pdtlum26s73eajoeg",
}


def request(path, method="GET", body=None):
    req = urllib.request.Request(API + path, method=method, headers={
        "Authorization": f"Bearer {KEY}", "Content-Type": "application/json",
        "User-Agent": "Handwerk-HR-cron-setup",
    }, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            return json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        # Error bodies can echo request configuration, including secret values.
        raise RuntimeError(f"Render {method} {path}: HTTP {error.code}") from None


def configure():
    for environment, api_id in TARGETS.items():
        api = request(f"/services/{api_id}")
        name = f"bsb-scheduled-deactivations-{environment}"
        listed = request(f"/services?ownerId={api['ownerId']}&name={name}&limit=100")
        existing = next((entry["service"] for entry in listed if entry["service"]["name"] == name), None)
        # Never rotate an existing secret or change an already configured job.
        if existing:
            print(f"{environment}: existing {existing['id']} ({existing['suspended']})")
            continue
        try:
            stored = request(f"/services/{api_id}/env-vars/CRON_SECRET")
            secret = stored.get("value") or stored.get("envVar", {}).get("value")
        except RuntimeError as error:
            if "HTTP 404" not in str(error):
                raise
            secret = None
        secret = secret or secrets.token_urlsafe(48)
        request(f"/services/{api_id}/env-vars/CRON_SECRET", "PUT", {"value": secret})
        url = api["serviceDetails"]["url"]
        # Use a mounted script so Render never needs to parse nested shell quotes.
        script = Path(__file__).with_name("scheduled-deactivations.sh").read_text()
        result = request("/services", "POST", {
            "type": "cron_job", "name": name, "ownerId": api["ownerId"],
            "autoDeployTrigger": "off",
            "image": {"ownerId": api["ownerId"], "imagePath": "docker.io/curlimages/curl:8.17.0"},
            "secretFiles": [{"name": "scheduled-deactivations.sh", "content": script}],
            "envVars": [{"key": "CRON_SECRET", "value": secret},
                        {"key": "API_URL", "value": url},
                        {"key": "SCHEDULED_DEACTIVATIONS_ENABLED", "value": "false"}],
            "serviceDetails": {
                "runtime": "image", "schedule": "* * * * *" if environment == "staging" else "*/5 * * * *", "plan": "starter",
                "region": api["serviceDetails"]["region"],
                "envSpecificDetails": {"dockerCommand": "/bin/sh /etc/secrets/scheduled-deactivations.sh",
                                       "dockerContext": "", "dockerfilePath": ""},
            },
        })
        service = result["service"]
        request(f"/services/{service['id']}/suspend", "POST")
        print(f"{environment}: configured {service['id']} (disabled and suspended)")


if __name__ == "__main__":
    configure()

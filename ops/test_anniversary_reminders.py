import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("anniversary-reminders.sh")


class AnniversaryCronScriptTest(unittest.TestCase):
    def run_script(self, enabled="true", secret="test secret with spaces", exit_code="0"):
        with tempfile.TemporaryDirectory() as directory:
            stub = Path(directory) / "curl"
            receipt = Path(directory) / "args.json"
            stub.write_text("#!/usr/bin/env python3\nimport json, os, sys\n"
                            "open(os.environ['CURL_RECEIPT'], 'w').write(json.dumps(sys.argv[1:]))\n"
                            "sys.exit(int(os.environ['CURL_EXIT']))\n")
            stub.chmod(0o755)
            env = {**os.environ, "PATH": directory + os.pathsep + os.environ["PATH"],
                   "ANNIVERSARY_REMINDERS_ENABLED": enabled, "CRON_SECRET": secret,
                   "API_URL": "https://api.example.test/", "CURL_RECEIPT": str(receipt),
                   "CURL_EXIT": exit_code}
            result = subprocess.run(["/bin/sh", str(SCRIPT)], env=env, capture_output=True, text=True)
            return result, json.loads(receipt.read_text()) if receipt.exists() else None

    def test_disabled_job_does_not_call_api(self):
        result, args = self.run_script(enabled="false")
        self.assertEqual(result.returncode, 0)
        self.assertIsNone(args)

    def test_request_preserves_header_and_url_as_single_arguments(self):
        result, args = self.run_script()
        self.assertEqual(result.returncode, 0)
        self.assertIn("Authorization: Bearer test secret with spaces", args)
        self.assertEqual(args[-1], "https://api.example.test/internal/cron/anniversary-reminders")
        self.assertIn("POST", args)
        self.assertNotIn("test secret", result.stdout + result.stderr)

    def test_curl_failure_fails_job(self):
        result, _ = self.run_script(exit_code="22")
        self.assertEqual(result.returncode, 22)

    def test_missing_secret_fails_before_request(self):
        result, args = self.run_script(secret="")
        self.assertNotEqual(result.returncode, 0)
        self.assertIsNone(args)


if __name__ == "__main__":
    unittest.main()

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("anniversary-reminders.sh")


class AnniversaryCronScriptTest(unittest.TestCase):
    def run_script(
        self,
        enabled="true",
        secret="test secret with spaces",
        api_url="https://api.example.test/",
        exit_code="0",
        include_enabled=True,
        include_secret=True,
        include_api_url=True,
    ):
        with tempfile.TemporaryDirectory() as directory:
            stub = Path(directory) / "curl"
            receipt = Path(directory) / "args.json"
            stub.write_text(
                "#!/usr/bin/env python3\n"
                "import json, os, sys\n"
                "open(os.environ['CURL_RECEIPT'], 'w').write(json.dumps(sys.argv[1:]))\n"
                "sys.exit(int(os.environ['CURL_EXIT']))\n"
            )
            stub.chmod(0o755)
            env = {
                **os.environ,
                "PATH": directory + os.pathsep + os.environ["PATH"],
                "CURL_RECEIPT": str(receipt),
                "CURL_EXIT": exit_code,
            }
            for key in (
                "ANNIVERSARY_REMINDERS_ENABLED",
                "CRON_SECRET",
                "API_URL",
            ):
                env.pop(key, None)
            if include_enabled:
                env["ANNIVERSARY_REMINDERS_ENABLED"] = enabled
            if include_secret:
                env["CRON_SECRET"] = secret
            if include_api_url:
                env["API_URL"] = api_url
            result = subprocess.run(
                ["/bin/sh", str(SCRIPT)],
                env=env,
                capture_output=True,
                text=True,
            )
            return (
                result,
                json.loads(receipt.read_text()) if receipt.exists() else None,
            )

    def test_disabled_job_does_not_call_api(self):
        result, args = self.run_script(enabled="false")
        self.assertEqual(result.returncode, 0)
        self.assertIn("disabled", result.stdout)
        self.assertIsNone(args)

    def test_unset_enabled_flag_defaults_to_disabled(self):
        result, args = self.run_script(include_enabled=False)
        self.assertEqual(result.returncode, 0)
        self.assertIsNone(args)

    def test_request_preserves_header_and_url_as_single_arguments(self):
        result, args = self.run_script()
        self.assertEqual(result.returncode, 0)
        self.assertIn("Authorization: Bearer test secret with spaces", args)
        self.assertEqual(
            args[-1],
            "https://api.example.test/internal/cron/anniversary-reminders",
        )
        self.assertIn("POST", args)
        self.assertNotIn("test secret", result.stdout + result.stderr)

    def test_strips_trailing_slash_from_api_url(self):
        result, args = self.run_script(api_url="https://api.example.test")
        self.assertEqual(result.returncode, 0)
        self.assertEqual(
            args[-1],
            "https://api.example.test/internal/cron/anniversary-reminders",
        )

    def test_curl_uses_fail_and_timeout_flags(self):
        result, args = self.run_script()
        self.assertEqual(result.returncode, 0)
        self.assertIn("--fail-with-body", args)
        self.assertIn("--connect-timeout", args)
        self.assertEqual(args[args.index("--connect-timeout") + 1], "10")
        self.assertIn("--max-time", args)
        self.assertEqual(args[args.index("--max-time") + 1], "240")

    def test_curl_failure_fails_job(self):
        result, _ = self.run_script(exit_code="22")
        self.assertEqual(result.returncode, 22)

    def test_missing_secret_fails_before_request(self):
        result, args = self.run_script(secret="")
        self.assertNotEqual(result.returncode, 0)
        self.assertIsNone(args)
        self.assertIn("CRON_SECRET", result.stderr)

    def test_missing_api_url_fails_before_request(self):
        result, args = self.run_script(include_api_url=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIsNone(args)
        self.assertIn("API_URL", result.stderr)

    def test_absent_secret_env_fails_before_request(self):
        result, args = self.run_script(include_secret=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIsNone(args)
        self.assertIn("CRON_SECRET", result.stderr)


if __name__ == "__main__":
    unittest.main()

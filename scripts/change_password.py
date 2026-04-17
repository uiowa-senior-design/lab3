#!/usr/bin/env python3
"""
change_password.py — Offline password change tool.

Usage:
    python3 scripts/change_password.py

This script:
  1. Prompts for the new password (input is hidden).
  2. Computes its SHA-256 hash.
  3. Rewrites the PASSWORD_HASH constant in assets/js/auth.js.

After running, commit and push (or redeploy) to apply the new password.
There is intentionally no way to change the password from the website itself.
"""

import hashlib
import re
import sys
import getpass
from pathlib import Path

AUTH_JS = Path(__file__).parent.parent / "assets" / "js" / "auth.js"
HASH_PATTERN = re.compile(
    r'(const PASSWORD_HASH\s*=\s*")[0-9a-f]+"',
    re.MULTILINE
)

def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def main():
    print("=== Flood Detection Network — Password Change ===\n")

    if not AUTH_JS.exists():
        print(f"ERROR: Could not find {AUTH_JS}", file=sys.stderr)
        sys.exit(1)

    new_pw = getpass.getpass("Enter new password: ")
    if not new_pw:
        print("ERROR: Password cannot be empty.", file=sys.stderr)
        sys.exit(1)

    confirm = getpass.getpass("Confirm new password: ")
    if new_pw != confirm:
        print("ERROR: Passwords do not match.", file=sys.stderr)
        sys.exit(1)

    new_hash = sha256(new_pw)

    content = AUTH_JS.read_text(encoding="utf-8")

    if not HASH_PATTERN.search(content):
        print(f"ERROR: Could not find PASSWORD_HASH line in {AUTH_JS}", file=sys.stderr)
        sys.exit(1)

    updated = HASH_PATTERN.sub(rf'\g<1>{new_hash}"', content)
    AUTH_JS.write_text(updated, encoding="utf-8")

    print(f"\n✓ Password updated successfully.")
    print(f"  Hash written to: {AUTH_JS}")
    print(f"\nNext steps:")
    print("  git add assets/js/auth.js")
    print('  git commit -m "Update site password"')
    print("  git push")
    print("  (Netlify will redeploy automatically)\n")

if __name__ == "__main__":
    main()

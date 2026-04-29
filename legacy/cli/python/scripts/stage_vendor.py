"""Stage the bundled @pptx/cli JavaScript into the Python wheel vendor dir.

Run from anywhere (paths are anchored to this file). Intended to be called
by the PyPI release workflow after `pnpm run build:bundle` in sdk/cli, but
also useful for local testing.
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PY_PKG = HERE.parent  # sdk/cli-python
REPO = PY_PKG.parent.parent  # pptx-dev repo root
JS_BUNDLE = REPO / "sdk" / "cli" / "dist-bundle" / "cli.cjs"
JS_PKG_JSON = REPO / "sdk" / "cli" / "package.json"
VENDOR = PY_PKG / "src" / "pptx_cli" / "vendor"


def main() -> int:
    if not JS_BUNDLE.is_file():
        print(
            f"error: bundled JS not found at {JS_BUNDLE}\n"
            "Run `pnpm --filter @pptx/cli run build:bundle` first.",
            file=sys.stderr,
        )
        return 1

    VENDOR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(JS_BUNDLE, VENDOR / "cli.cjs")

    # Drop a minimal package.json alongside so the bundled CLI's
    # version-walker (which climbs up from __dirname looking for a
    # package.json with a version field) finds a stable answer instead
    # of whichever package.json happens to live above site-packages.
    js_pkg = json.loads(JS_PKG_JSON.read_text())
    stub = {
        "name": js_pkg.get("name", "@pptx/cli"),
        "version": js_pkg.get("version", "0.0.0"),
        "private": True,
    }
    (VENDOR / "package.json").write_text(json.dumps(stub, indent=2) + "\n")

    print(f"staged {JS_BUNDLE} -> {VENDOR / 'cli.cjs'}")
    print(f"wrote  version stub at {VENDOR / 'package.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

VENDOR_DIR = Path(__file__).resolve().parent / "vendor"
BUNDLED_CLI = VENDOR_DIR / "cli.cjs"

NODE_INSTALL_HINT = """\
pptx-cli requires Node.js 20 or newer on your PATH.

Install Node.js:
  macOS (Homebrew):   brew install node
  Debian/Ubuntu:      sudo apt install nodejs
  Fedora/RHEL:        sudo dnf install nodejs
  Windows (winget):   winget install OpenJS.NodeJS.LTS
  Any platform:       https://nodejs.org/

Or use the npm-installable CLI instead:
  npm install -g @pptx/cli

Set PPTX_NODE_BIN to override the Node executable this wrapper uses.
"""


def _find_node() -> str | None:
    override = os.environ.get("PPTX_NODE_BIN")
    if override:
        return override
    return shutil.which("node")


def run() -> None:
    if not BUNDLED_CLI.is_file():
        sys.stderr.write(
            f"pptx-cli is missing its bundled CLI at {BUNDLED_CLI}.\n"
            "Reinstall with `pipx install --force pptx-cli`.\n"
        )
        sys.exit(2)

    node = _find_node()
    if node is None:
        sys.stderr.write(NODE_INSTALL_HINT)
        sys.exit(2)

    argv = [node, str(BUNDLED_CLI), *sys.argv[1:]]
    try:
        completed = subprocess.run(argv, check=False)  # noqa: S603
    except FileNotFoundError:
        sys.stderr.write(f"Could not execute Node at {node!r}.\n")
        sys.stderr.write(NODE_INSTALL_HINT)
        sys.exit(2)
    except KeyboardInterrupt:
        sys.exit(130)
    sys.exit(completed.returncode)

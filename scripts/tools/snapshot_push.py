#!/usr/bin/env python3
"""Create a snapshot branch, commit current files, and push it.

This script mirrors the manual flow used for the current-version upload:

- create or switch to the target branch
- stage all current files except ignored deployment/local files
- verify excluded paths were not staged
- run ``npm run check``
- commit if there are staged changes
- push the branch to origin
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path


DEFAULT_BRANCH = "新增魔水-調整神酒-魔水體感-預設道具有5神水5魔水"
DEFAULT_REMOTE = "origin"
DEFAULT_MESSAGE = "Snapshot current consumable tuning version"

EXCLUDED_SPECS = [
    ":(exclude)node_modules",
    ":(exclude)node_modules/**",
    ":(exclude)dist",
    ":(exclude)dist/**",
    ":(exclude).env",
    ":(exclude).DS_Store",
    ":(exclude)Thumbs.db",
    ":(exclude).github",
    ":(exclude).github/**",
]

EXCLUDED_PREFIXES = (
    b"node_modules/",
    b"dist/",
    b".github/",
)

EXCLUDED_FILES = {
    b".env",
    b".DS_Store",
    b"Thumbs.db",
}


class CommandError(RuntimeError):
    def __init__(self, args: list[str], returncode: int, output: bytes):
        self.args_list = args
        self.returncode = returncode
        self.output = output
        super().__init__(f"{args!r} failed with exit code {returncode}")


def run(
    args: list[str],
    cwd: Path,
    *,
    check: bool = True,
    input_bytes: bytes | None = None,
    capture: bool = True,
) -> subprocess.CompletedProcess[bytes]:
    print(f"$ {' '.join(args)}")
    result = subprocess.run(
        args,
        cwd=cwd,
        input=input_bytes,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.STDOUT if capture else None,
        check=False,
    )
    output = result.stdout or b""
    if output:
        sys.stdout.buffer.write(output)
        if not output.endswith((b"\n", b"\r")):
            print()
    if check and result.returncode != 0:
        raise CommandError(args, result.returncode, output)
    return result


def git(cwd: Path, *args: str, check: bool = True) -> subprocess.CompletedProcess[bytes]:
    return run(["git", *args], cwd, check=check)


def npm_check(cwd: Path) -> None:
    if os.name == "nt":
        run(["cmd", "/c", "npm", "run", "check"], cwd)
    else:
        run(["npm", "run", "check"], cwd)


def output_lines(result: subprocess.CompletedProcess[bytes]) -> list[str]:
    return result.stdout.decode("utf-8", errors="replace").splitlines()


def current_branch(cwd: Path) -> str:
    result = git(cwd, "rev-parse", "--abbrev-ref", "HEAD")
    return result.stdout.decode("utf-8", errors="replace").strip()


def branch_exists(cwd: Path, branch: str) -> bool:
    result = git(cwd, "branch", "--format=%(refname:short)", "--list", branch)
    return branch in output_lines(result)


def ensure_branch(cwd: Path, branch: str) -> None:
    active = current_branch(cwd)
    if active == branch:
        print(f"Already on {branch}")
        return
    if branch_exists(cwd, branch):
        git(cwd, "switch", branch)
        return
    git(cwd, "switch", "-c", branch)


def stage_snapshot(cwd: Path) -> None:
    # Track modifications/deletions while excluding deployment/local-only paths.
    git(cwd, "add", "-u", "--", ".", *EXCLUDED_SPECS)

    # Add untracked files through a NUL-delimited pipe to preserve Chinese paths.
    untracked = git(cwd, "ls-files", "-o", "--exclude-standard", "-z")
    if untracked.stdout:
        run(
            ["git", "add", "--pathspec-from-file=-", "--pathspec-file-nul"],
            cwd,
            input_bytes=untracked.stdout,
        )


def staged_names(cwd: Path) -> list[bytes]:
    result = git(cwd, "diff", "--cached", "--name-only", "--no-renames", "-z")
    return [name for name in result.stdout.split(b"\0") if name]


def verify_exclusions(cwd: Path) -> None:
    bad = [
        name
        for name in staged_names(cwd)
        if name in EXCLUDED_FILES or name.startswith(EXCLUDED_PREFIXES)
    ]
    if bad:
        rendered = "\n".join(name.decode("utf-8", errors="replace") for name in bad[:50])
        raise RuntimeError(f"Excluded paths were staged:\n{rendered}")
    print("Excluded staged paths: 0")


def staged_change_count(cwd: Path) -> int:
    return len(staged_names(cwd))


def commit_if_needed(cwd: Path, message: str) -> str | None:
    count = staged_change_count(cwd)
    print(f"Staged file count: {count}")
    if count == 0:
        print("No staged changes; skipping commit.")
        return None
    git(cwd, "commit", "-m", message)
    result = git(cwd, "rev-parse", "--short=8", "HEAD")
    commit = result.stdout.decode("utf-8", errors="replace").strip()
    print(f"Created commit: {commit}")
    return commit


def push_branch(cwd: Path, remote: str, branch: str) -> None:
    try:
        git(cwd, "push", "-u", remote, branch)
    except CommandError as exc:
        text = exc.output.decode("utf-8", errors="replace")
        if "The requested URL returned error: 403" in text or "Permission" in text:
            raise RuntimeError(
                "Push failed because the active GitHub account does not have write "
                f"permission for {remote}/{branch}. Log in with an authorized account "
                "or add this account as a collaborator, then rerun the push."
            ) from exc
        raise


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Snapshot the current repo state to a branch and push it."
    )
    parser.add_argument("--branch", default=DEFAULT_BRANCH)
    parser.add_argument("--remote", default=DEFAULT_REMOTE)
    parser.add_argument("--message", default=DEFAULT_MESSAGE)
    parser.add_argument("--repo", default=".", type=Path)
    parser.add_argument(
        "--skip-check",
        action="store_true",
        help="Skip npm run check before committing.",
    )
    parser.add_argument(
        "--skip-push",
        action="store_true",
        help="Create the branch/commit but do not push.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    cwd = args.repo.resolve()
    if not (cwd / ".git").exists():
        print(f"Not a Git repository: {cwd}", file=sys.stderr)
        return 2

    try:
        ensure_branch(cwd, args.branch)
        stage_snapshot(cwd)
        verify_exclusions(cwd)
        if not args.skip_check:
            npm_check(cwd)
        commit_if_needed(cwd, args.message)
        if not args.skip_push:
            push_branch(cwd, args.remote, args.branch)
    except (CommandError, RuntimeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

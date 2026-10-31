# Agent instructions

## Ship staging

When the user says `ship staging` (or clearly the same intent in few words):

1. Commit only the relevant files for the current work (exclude unrelated dirty files and secrets).
2. Push the current branch to `origin`.
3. Merge that branch into `staging`. If `staging` is checked out in another worktree, run the merge there.
4. Push `staging` to `origin`.
5. Reply with the commit hash and the staging merge result.

Follow normal git safety rules: no force-push, no config changes, no skipping hooks unless explicitly asked.

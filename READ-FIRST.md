# Small mobile motion update

This follows the rendering-quality fix you deployed in commit d5b3c7e. It is not live yet.

Copy only `mobile-motion-polish.patch` beside `package.json` in your real project: `C:\portfolio 3d\portfolio`.

Run these in Git Bash, one at a time:

```bash
git apply --check mobile-motion-polish.patch
git apply mobile-motion-polish.patch
npm run verify
```

No output from the patch commands means success. Stop and share any error before continuing.

Apply the patch to the actual project before committing. Uploading the ZIP or replacement folder alone does not apply the changes.

Complete replacement code for all nine changed files is in `replacement-files/`, with the exact project paths. It is an alternative to the patch, not a complete application. Do not replace the whole src folder or build in replacement-files.

`APPLY-AND-VERIFY.md` lists the findings, changes, tests and exact Git/Render deployment steps. Stage only its nine listed paths, rather than using git add .

All 46 Node tests, the production build, 31 browser scroll/preference checks and 82 layout checks passed. The cloud browser has WebGL disabled: actual phone GPU smoothness and rendering still need your verification after deploying this update.

# Favas responsive 3D quality fix

This update is prepared for your portfolio after commit c2488a0. It is not deployed yet.

1. Copy only `responsive-3d-quality.patch` beside `package.json` in `C:\portfolio 3d\portfolio`.
2. Open Git Bash in that project and run these commands one at a time:

```bash
git apply --check responsive-3d-quality.patch
git apply responsive-3d-quality.patch
npm run verify
```

The patch commands normally produce no output when they succeed. Stop if the first command reports an error and share it before continuing.

`APPLY-AND-VERIFY.md` contains the root causes, all 13 changed paths, test results, exact Git/Render deployment steps and the remaining real-device checks.

`replacement-files/` contains complete replacement code for every changed file, preserving its project path. It is an alternative to the patch, not a second application step. Do not replace the entire src folder, build inside replacement-files, or commit the ZIP/patch/replacement folder. Stage only the 13 paths listed in the guide.

Verification: 43 Node tests, production build and output checks passed. Chromium layout/scroll assertions passed. The available browser has WebGL disabled, so rendered 3D screenshots, phone GPU performance, real Android Chrome and iPhone Safari still require verification. The archive includes a development-only stage comparison fixture for those checks.

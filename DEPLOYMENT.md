# Deployment

Production infrastructure: **Vercel** (frontend) and **Render** (backend, Docker), both on their AWS-provided-equivalent default domains — no custom domain owned/required.

- Frontend: `https://<project>.vercel.app`
- Backend: `https://<service>.onrender.com`

Both get automatic HTTPS on their default domains out of the box.

An alternate AWS-based deployment (Amplify + App Runner) exists in [infra/terraform/](infra/terraform/) but is currently parked — see [infra/terraform/README.md](infra/terraform/README.md).

## One-time setup

### Backend (Render)

1. [dashboard.render.com](https://dashboard.render.com) → connect your GitHub account, authorize this repo.
2. **New +** → **Blueprint** → select this repo. Render detects `render.yaml` at the repo root and proposes the `canteen-backend` Docker web service (it builds `server/Dockerfile` with the repo root as build context — same image already verified locally against Atlas).
3. Fill in the env vars marked `sync: false` in `render.yaml`:
   - `MONGODB_URI` — Atlas connection string
   - `JWT_SECRET` — long random string
   - `CLIENT_ORIGIN` — leave blank until the Vercel URL exists (step below), then come back and set it
4. Deploy. Render assigns `https://canteen-backend.onrender.com` (exact subdomain may differ), auto-restarts on crash, and redeploys on every push to `main`.
5. Verify: `curl https://<render-url>/api/health` → `{"status":"ok","db":true}`.

Free tier idles after 15 min and takes ~30-60s to wake up on the next request; pick a paid instance if that's not acceptable.

### Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import this repo.
2. Vercel reads `vercel.json` at the repo root for the install/build commands and output directory — leave **Root Directory** as the repo root.
3. Add environment variable `VITE_API_URL` = `<render-url>/api` before deploying.
4. Deploy. You get `https://<project>.vercel.app`, redeploying on every push to `main`.
5. Back in Render, set `CLIENT_ORIGIN` to this exact Vercel URL (no trailing slash) and save (triggers a redeploy).

## Redeploying

Automatic — both platforms redeploy on push to `main` once connected (no separate CI/CD to maintain).

## Rotating secrets

Update `MONGODB_URI` / `JWT_SECRET` in the Render dashboard's Environment tab; saving triggers a redeploy that picks up the new value.

## Attaching a custom domain later

No rebuild required — both platforms support this directly:
- **Vercel**: Project → Settings → Domains → add your domain, follow the DNS instructions.
- **Render**: Service → Settings → Custom Domains → add your domain, follow the DNS instructions.
- Update `CLIENT_ORIGIN` (Render env var) and `VITE_API_URL` (Vercel env var) to the new domains and redeploy.

## Local development

Unchanged — `npm run dev` in `client/` and `server/` as before. `client/.env` / `server/.env` stay local-only (gitignored) and are never used in production.

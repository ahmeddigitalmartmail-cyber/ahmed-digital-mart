# Render Free Deployment

1. Upload this folder to a private GitHub repository.
2. Render -> New -> Web Service -> connect the GitHub repository.
3. Choose Free plan. Build Command: `npm install`; Start Command: `npm start`.
4. Add the environment variables from `render.yaml`.
5. IMPORTANT: do not set PORT manually on Render; Render provides PORT automatically.
6. Set `COOKIE_SECURE=true` because Render serves the public service over HTTPS.
7. For easiest admin login, set `ADMIN_USERNAME=admin` and `ADMIN_PASSWORD` to your own password. You may instead use `ADMIN_PASSWORD_HASH`. Do not set both unless you know which one you want; hash takes priority.
8. Health check: `/health`.

Free Render web services spin down after 15 minutes without inbound traffic and wake on the next request, so the first request after idle can be slower. Render documents the free tier as intended for testing/hobby use rather than production.

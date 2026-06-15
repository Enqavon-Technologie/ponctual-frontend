<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/f83d0587-7fa1-4be6-b661-beba4751024c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy

1. Build: `npm run build` (output in `dist/`).
2. Serve `dist/` from the site root (e.g. `https://ponctuel.bloom-buddies.fr/`),
   with `VITE_API_BASE_URL` pointing at the production API.
3. **SPA routing is required.** Deep links like `/price/:id`, `/contract/:id`,
   `/match/:id`, `/cmg/:id`, `/babysitter-contract/:id` and `/interview/:channel`
   are resolved client-side, so the server must serve `index.html` for any route
   that isn't a real file. On Apache this is handled automatically by the
   shipped [`public/.htaccess`](public/.htaccess). On **nginx**, add:

   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

   Without this, opening an emailed link directly returns 404 and the user sees
   a blank page.

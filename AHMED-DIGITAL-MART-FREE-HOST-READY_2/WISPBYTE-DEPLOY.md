# Wispbyte Deployment — AHMED DIGITAL & MART

## 1) Upload
Upload/extract this project on Wispbyte. The folder containing `package.json` and `server.mjs` is the app root.

## 2) Install packages
Run the normal Node package install available in your Wispbyte panel. The startup command is:

```
npm start
```

## 3) Environment Variables
Add these in Wispbyte — do not put real secrets in `.env.example`:

```
COMETAPI_KEY=YOUR_COMETAPI_KEY
COMETAPI_BASE_URL=https://api.cometapi.com/v1beta
COMETAPI_MODEL=gemini-3.8-flash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
SUPABASE_BUCKET=product-images
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=YOUR_BCRYPT_HASH
SESSION_SECRET=YOUR_LONG_RANDOM_SECRET
BUSINESS_WHATSAPP=8801922198493
NODE_ENV=production
PORT=3000
```

If Wispbyte assigns the PORT automatically, keep the app's `process.env.PORT` behavior and use the platform-provided value.

## 4) Supabase
Run `supabase-schema.sql` in Supabase SQL Editor. Create a Storage bucket named `product-images`.

## 5) Test
Open `/health`. Then open the website and test: product list, AI chat, admin login, product creation, stock update, order, and WhatsApp button.

## 6) AI API
The backend sends requests to:

`https://api.cometapi.com/v1beta/models/gemini-3.8-flash:generateContent`

with `Authorization: $COMETAPI_KEY`. This matches the CometAPI request format supplied for this project.

## 7) Important
Never send your actual API key to ChatGPT or put it inside `public/app.js`, `public/index.html`, or any browser-visible file.

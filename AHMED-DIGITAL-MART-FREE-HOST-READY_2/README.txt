AHMED DIGITAL & MART — Wispbyte + CometAPI Ready

STACK
- Node.js + Express
- Supabase database + Storage
- CometAPI -> Gemini generateContent
- Customer website + cart + order + WhatsApp
- Admin product/stock/order management

WISPBYTE ENVIRONMENT VARIABLES
1. COMETAPI_KEY = your CometAPI key
2. COMETAPI_BASE_URL = https://api.cometapi.com/v1beta
3. COMETAPI_MODEL = gemini-3.8-flash
4. SUPABASE_URL = your Supabase project URL
5. SUPABASE_SECRET_KEY = your Supabase server secret key
6. SUPABASE_BUCKET = product-images
7. ADMIN_USERNAME = your admin username
8. ADMIN_PASSWORD_HASH = bcrypt hash of your admin password
9. SESSION_SECRET = long random secret
10. BUSINESS_WHATSAPP = 8801922198493
11. NODE_ENV = production
12. PORT = 3000 (or leave blank if Wispbyte provides PORT)

STARTUP COMMAND
npm start

COMETAPI REQUEST USED BY THE SERVER
POST https://api.cometapi.com/v1beta/models/gemini-3.8-flash:generateContent
Authorization: $COMETAPI_KEY
Content-Type: application/json

The API key is server-side only. It is never exposed to browser JavaScript.

SUPABASE SETUP
- Open supabase-schema.sql and run it in Supabase SQL Editor.
- Create a Storage bucket named product-images.
- Set SUPABASE_BUCKET=product-images.

HEALTH CHECK
Open: https://YOUR-WISPBYTE-DOMAIN/health
Expected JSON: {"ok":true,"service":"AHMED DIGITAL & MART"}

SECURITY
- Do NOT paste COMETAPI_KEY, Supabase secret key, or SESSION_SECRET into the frontend.
- Do NOT commit real secrets to GitHub or upload them into public files.
- For subscriptions/verification services, never ask customers for passwords or OTPs.

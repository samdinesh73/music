# Deployment Guide: Vercel + Render

## Step 1: Get Your Render Backend URL

1. Go to [render.com](https://render.com)
2. Find your backend service
3. Copy the URL from the dashboard (looks like: `https://music-sync-api.onrender.com`)
4. Test it works: Visit `https://YOUR-RENDER-URL/api/health`
   - Should show: `{"status":"ok"}`

---

## Step 2: Set Environment Variables on Vercel

### Option A: Through Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** `https://YOUR-RENDER-URL` (replace with your Render URL)
   - **Environments:** Select `Production` (and `Preview` if needed)
5. Click **Save**
6. **Redeploy** your project:
   - Go to **Deployments** tab
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Set production environment variable
vercel env add NEXT_PUBLIC_SOCKET_URL

# Enter your Render URL when prompted:
# https://YOUR-RENDER-URL
```

### Option C: Update vercel.json

Create `vercel.json` in your frontend root:

```json
{
  "env": {
    "NEXT_PUBLIC_SOCKET_URL": "@socket_url"
  }
}
```

Then set the secret in CLI:
```bash
vercel secrets add socket_url https://YOUR-RENDER-URL
```

---

## Step 3: Update Backend CORS (Important!)

In `backend/server.js`, update the CORS allowed origins to include your Vercel domain:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://music-navy-nine.vercel.app', // ← Your Vercel URL
      'https://*.vercel.app', // Allow all Vercel domains
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
```

Then push to your Render backend:
```bash
git push origin main
# Render will auto-deploy
```

---

## Step 4: Update Backend API Calls

In `frontend/app/page.tsx`, update the room creation endpoint:

```javascript
// Change from:
const response = await fetch('http://localhost:3001/api/rooms/create', {

// To:
const response = await fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL}/api/rooms/create`, {
```

---

## Step 5: Verify Everything Works

1. **Wait 2-3 minutes** for Vercel redeploy
2. Open your Vercel URL: `https://music-navy-nine.vercel.app`
3. Check browser console (F12) for errors
4. Check that it says "Connecting to server..." then loads (not stuck)
5. Click "Create New Room" to test

---

## Troubleshooting

### Still Showing "Connecting to server..."

**Check 1: Is backend running?**
```bash
curl https://YOUR-RENDER-URL/api/health
# Should return: {"status":"ok"}
```

**Check 2: Environment variable set?**
- Vercel Dashboard → Settings → Environment Variables
- Make sure `NEXT_PUBLIC_SOCKET_URL` is there

**Check 3: Did you redeploy?**
- Vercel → Deployments → Redeploy latest

**Check 4: Browser console errors?**
- Press F12 → Console tab
- Look for WebSocket or CORS errors

### CORS Error in Console

Error like: `Access to XMLHttpRequest blocked by CORS`

**Solution:**
1. Update backend CORS (see Step 3 above)
2. Redeploy backend on Render
3. Clear browser cache: Ctrl+Shift+Delete
4. Refresh Vercel app

### WebSocket Connection Refused

Error: `WebSocket connection closed`

**Solution:**
- Verify Render backend is running
- Check `NEXT_PUBLIC_SOCKET_URL` doesn't have trailing slash
- Try `https://` instead of `http://`

---

## Environment Variable Quick Reference

### Local Development (.env.local)
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Production on Vercel
```
NEXT_PUBLIC_SOCKET_URL=https://YOUR-RENDER-URL
```

### Backend on Render (No env vars needed!)
- Backend reads from PORT environment variable automatically
- Render sets PORT=10000 or similar

---

## Complete URL Examples

**If your Render URL is:** `https://music-sync-api.onrender.com`

**Then set on Vercel:**
```
NEXT_PUBLIC_SOCKET_URL=https://music-sync-api.onrender.com
```

**Frontend will connect to:**
- Socket.IO: `https://music-sync-api.onrender.com`
- API: `https://music-sync-api.onrender.com/api/rooms/create`

---

## Deployment Checklist

- [ ] Backend deployed on Render
- [ ] Render URL copied
- [ ] Environment variable set on Vercel
- [ ] Vercel project redeployed
- [ ] Backend CORS updated with Vercel domain
- [ ] Backend redeployed on Render
- [ ] Frontend loads without "Connecting..." spinner
- [ ] Can create a room
- [ ] Can join a room
- [ ] YouTube player loads
- [ ] Play/pause works

---

## Additional Notes

- **Render free tier:** May be slow initially (cold start). Wait 30s on first load
- **Vercel:** Changes to env vars require redeploy to take effect
- **HTTPS:** Must use `https://` for Render production URLs
- **Credentials:** Set `credentials: true` in Socket.IO CORS for authentication

Need help? Check backend logs on Render or frontend logs on Vercel!

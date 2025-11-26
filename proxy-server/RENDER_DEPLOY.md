# Deploy to Render.com - Quick Guide

## Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Add proxy server for secure API key management"
git push origin desktop-branch
```

## Step 2: Deploy to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub (recommended)

2. **Create New Web Service**
   - Click "New +" button → Select "Web Service"
   - Connect your GitHub repository: `BootlegYouki/set-2-system`
   - Select the `desktop-branch` branch

3. **Configure the Service**
   - **Name**: `set2-proxy` (or whatever you prefer)
   - **Region**: Choose closest to you
   - **Branch**: `desktop-branch`
   - **Root Directory**: `proxy-server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

4. **Add Environment Variable**
   - Scroll down to "Environment Variables"
   - Click "Add Environment Variable"
   - **Key**: `OPENROUTER_API_KEY_DESKTOP`
   - **Value**: Your OpenRouter API key (from https://openrouter.ai/keys)
   - Click "Save"

5. **Deploy!**
   - Click "Create Web Service"
   - Wait 2-3 minutes for deployment
   - Copy your URL: `https://set2-proxy.onrender.com` (or similar)

## Step 3: Update Your Electron App

1. **Update `.env` file** in the root of your project:
   ```
   VITE_PROXY_URL=https://set2-proxy.onrender.com
   ```
   (Replace with your actual Render URL)

2. **Rebuild your app**:
   ```bash
   npm run build
   npm run package
   ```

## Step 4: Test

1. Open the packaged `.exe` from `release/` folder
2. Test the AI features (chatbot, analytics)
3. They should work perfectly! 🎉

## Important Notes

⚠️ **Free tier sleeps after 15 min of inactivity** - First request after sleep takes ~30-60 seconds
💡 To prevent sleep, upgrade to paid tier ($7/month) or use a different service
✅ Your API key is 100% secure on Render's servers
🔒 Nobody can extract it from your packaged app

## Troubleshooting

**Build failing?**
- Make sure Root Directory is set to `proxy-server`
- Check that Build Command is `npm install`

**"API key not configured" error?**
- Verify you added the OPENROUTER_API_KEY environment variable
- Check there are no extra spaces in the key

**App can't connect to proxy?**
- Make sure VITE_PROXY_URL in `.env` matches your Render URL exactly
- Rebuild the app after changing `.env`

## Your Render URL

After deployment, your proxy will be available at:
```
https://your-service-name.onrender.com
```

Update this in your `.env` file!

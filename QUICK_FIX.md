# Quick Fix for Cloudinary Upload Error

## Step 1: Check Current Configuration

Run this command to see if quotes are still present:

```bash
cd server
npm run check:cloudinary
```

This will show you exactly what's wrong.

---

## Step 2: Fix the .env File

Open `/server/.env` and find these lines (around line 20-23):

### Remove quotes from these three lines:

**Before (WRONG - has quotes):**
```env
CLOUDINARY_CLOUD_NAME="dkcui067d"
CLOUDINARY_API_KEY="378168273153864"
CLOUDINARY_API_SECRET="WVD6FI43h62qKFjCFKxUAYEL4XE"
```

**After (CORRECT - no quotes):**
```env
CLOUDINARY_CLOUD_NAME=dkcui067d
CLOUDINARY_API_KEY=378168273153864
CLOUDINARY_API_SECRET=WVD6FI43h62qKFjCFKxUAYEL4XE
```

**Just delete the `"` characters!**

---

## Step 3: Save and Restart

1. Save the `.env` file
2. Stop the server (Ctrl+C in terminal)
3. Start it again:
   ```bash
   npm run dev
   ```

---

## Step 4: Verify It Works

You should see this in the console:

```
✅ Cloudinary configured: {
  cloud_name: 'dkcui067d',
  api_key: '***3864',
  api_secret: '***'
}
```

NOT this:
```
❌ Cloudinary credentials missing
```

---

## Step 5: Test Upload

1. Go to admin panel
2. Edit any tour
3. Go to Media tab
4. Try uploading an image
5. Should work! ✅

---

## Still Not Working?

Run the check again:
```bash
npm run check:cloudinary
```

It will tell you exactly what's wrong.

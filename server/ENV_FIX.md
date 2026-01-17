# ⚠️ CLOUDINARY CONFIGURATION FIX

## Problem
Your `.env` file has **quotes** around the Cloudinary values:

```env
❌ WRONG:
CLOUDINARY_CLOUD_NAME="dkcui067d"
CLOUDINARY_API_KEY="378168273153864"
CLOUDINARY_API_SECRET="WVD6FI43h62qKFjCFKxUAYEL4XE"
```

## Solution
Remove the quotes! The `.env` file should have values WITHOUT quotes:

```env
✅ CORRECT:
CLOUDINARY_CLOUD_NAME=dkcui067d
CLOUDINARY_API_KEY=378168273153864
CLOUDINARY_API_SECRET=WVD6FI43h62qKFjCFKxUAYEL4XE
```

## How to Fix

1. Open `/server/.env` file
2. Find lines 20-23 (Cloudinary section)
3. Remove the quotes `"` from all three values
4. Save the file
5. Restart the server

### Before:
```env
CLOUDINARY_CLOUD_NAME="dkcui067d"
CLOUDINARY_API_KEY="378168273153864"
CLOUDINARY_API_SECRET="WVD6FI43h62qKFjCFKxUAYEL4XE"
```

### After:
```env
CLOUDINARY_CLOUD_NAME=dkcui067d
CLOUDINARY_API_KEY=378168273153864
CLOUDINARY_API_SECRET=WVD6FI43h62qKFjCFKxUAYEL4XE
```

## Why This Matters

Node.js `dotenv` package reads values literally. When you have:
```env
API_KEY="12345"
```

It reads the value as: `"12345"` (including the quotes!)

Cloudinary then receives: `"12345"` instead of `12345` and fails.

## After Fixing

1. Save `.env` without quotes
2. Restart server: `npm run dev`
3. You should see:
   ```
   ✅ Cloudinary configured: {
     cloud_name: 'dkcui067d',
     api_key: '***3864',
     api_secret: '***'
   }
   ```
4. Upload should work! 🎉

# Cloudinary Upload Configuration Guide

## Issue
The error "Must supply api_key" occurs because Cloudinary credentials are not properly configured in your environment variables.

## Solution

### Step 1: Get Cloudinary Credentials
1. Go to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Sign in to your account (or create one if you don't have it)
3. From the dashboard, you'll see:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### Step 2: Add Credentials to Server .env File

Open `/server/.env` and add the following variables:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=jes-egypt-tours
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 3: Restart the Server

After adding the credentials, restart your development server:

```bash
cd server
npm run dev
```

You should see this message in the console:
```
✅ Cloudinary configured: {
  cloud_name: 'your_cloud_name',
  api_key: '***2345',
  api_secret: '***'
}
```

### Step 4: Test Image Upload

1. Go to the tour creation page
2. Navigate to the "Media" tab
3. Click on an upload area or drag and drop an image
4. The image should upload successfully to Cloudinary

## Verification

If configured correctly, you should see:
- ✅ No "Must supply api_key" error
- ✅ Images upload to Cloudinary
- ✅ Image URLs returned in the format: `https://res.cloudinary.com/your_cloud_name/...`

## Troubleshooting

### Still getting "Must supply api_key" error?
1. Check that there are no extra spaces in your .env file
2. Make sure the variable names are exactly: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
3. Restart the server after making changes
4. Check the server console for the "✅ Cloudinary configured" message

### Upload fails with other errors?
1. Check your Cloudinary account quota (free tier has limits)
2. Verify your API credentials are correct
3. Check the server console for detailed error messages

## Security Note

⚠️ **IMPORTANT**: Never commit your `.env` file to version control!

The `.env` file should already be in `.gitignore`. If not, add it:

```gitignore
# .gitignore
.env
.env.local
.env.*.local
```

## Alternative: Use Environment Variables Directly

If you prefer not to use a `.env` file, you can set environment variables directly:

**macOS/Linux:**
```bash
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
npm run dev
```

**Windows:**
```cmd
set CLOUDINARY_CLOUD_NAME=your_cloud_name
set CLOUDINARY_API_KEY=your_api_key
set CLOUDINARY_API_SECRET=your_api_secret
npm run dev
```

---

Once configured, the enhanced MediaTab will provide:
- ✅ Grid layout for images
- ✅ Drag-and-drop upload
- ✅ Image previews
- ✅ Loading indicators
- ✅ Hover effects for better UX

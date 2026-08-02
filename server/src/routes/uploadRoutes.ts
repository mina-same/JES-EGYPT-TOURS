import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Request, Response } from 'express';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validate Cloudinary credentials
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary credentials missing in environment variables');
  console.error('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('✅ Cloudinary configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : 'MISSING'
});

// Configure Multer (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload Endpoint
// `protect` first, so an anonymous request is rejected BEFORE multer buffers the
// file: without it this was an open door to the project's Cloudinary account.
// Every caller is an admin screen going through the axios instance that attaches
// the bearer token, so nothing visitor-facing depends on this being public.
router.post('/', protect, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    // Convert buffer to base64
    const b64 = Buffer.from(req.file.buffer).toString('base64');
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'jes-egypt-tours', // Optional: organize uploads in a folder
      resource_type: 'auto',
    });

    res.json({
      success: true,
      data: {
        url: result.secure_url,
        fileName: req.file.originalname, // Return original filename as requested
        public_id: result.public_id,
        // Cloudinary already measured the file — passing the dimensions on lets
        // the admin store them so og:image:width / og:image:height can be
        // emitted. Absent for non-image uploads (resource_type: 'auto').
        width: result.width,
        height: result.height,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Upload failed' });
  }
});

export default router;

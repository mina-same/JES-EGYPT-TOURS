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

/* Cloudinary is billed per upload and per byte, and `memoryStorage` buffers the
   whole file in the process before anything is validated, so an authenticated
   account could exhaust memory with a handful of large requests. The limit and
   the type filter are the cheap guards; both reject before the buffer is
   handed to Cloudinary.
   SVG is excluded on purpose: it is a document format that can carry script,
   and it is served back from a domain we control. PDF is allowed because
   brochures upload through this same route. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'application/pdf',
]);

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

/* Multer reports both the size limit and the filter rejection by handing an
   error to the next middleware, which would otherwise surface as a generic 500.
   Wrapping it lets the caller see which guard fired. */
const uploadSingleFile = (req: Request, res: Response, next: express.NextFunction) => {
  upload.single('file')(req, res, (error: any) => {
    if (!error) {
      next();
      return;
    }
    const isTooLarge = error?.code === 'LIMIT_FILE_SIZE';
    res.status(isTooLarge ? 413 : 400).json({
      success: false,
      error: isTooLarge
        ? `File exceeds the ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit`
        : error?.message || 'Upload rejected',
    });
  });
};

// Upload Endpoint
// `protect` first, so an anonymous request is rejected BEFORE multer buffers the
// file: without it this was an open door to the project's Cloudinary account.
// Every caller is an admin screen going through the axios instance that attaches
// the bearer token, so nothing visitor-facing depends on this being public.
router.post('/', protect, uploadSingleFile, async (req: Request, res: Response): Promise<void> => {
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

import multer from 'multer';
import { cloudinary } from '../config/cloudinary.js';

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File received in filter:', file?.originalname);
    console.log('📎 MIME type:', file?.mimetype);
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported`), false);
    }
  },
});

const debugUpload = (req, res, next) => {
  console.log('🔍 Content-Type:', req.headers['content-type']);
  console.log('🔍 Body:', req.body);
  next();
};

export default upload;
export { debugUpload };
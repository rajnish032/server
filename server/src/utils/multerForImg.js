import multer from 'multer';

const storage = multer.memoryStorage();

const uploadImage = multer({
    storage,
    limits: { fileSize: 1 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/gif') {
            return cb(new Error('GIF files are not allowed!'), false);
        }
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export default uploadImage;

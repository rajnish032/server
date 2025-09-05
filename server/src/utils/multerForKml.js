import multer from 'multer';

const storage = multer.memoryStorage();

const uploadKml = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.google-earth.kml+xml',
      'application/vnd.google-earth.kmz',
      'application/xml', 
      'text/xml',         
      'application/octet-stream', 
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only KML and KMZ files are allowed!'), false);
    }
  }
});

export default uploadKml;

import multer from 'multer';

const storage = multer.memoryStorage();

const uploadXlsx = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
      file.mimetype !== "application/vnd.ms-excel" 
    ) {
      return cb(new Error("Only Excel files are allowed"), false);
    }
    cb(null, true);
  },
});

export default uploadXlsx;

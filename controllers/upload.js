import multer from 'multer';

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "static/users-avatar");
  },
  filename: function (req, file, callback) {
    callback(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5000000, // 5mb
  },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      return callback(new Error("Please upload a Picture(PNG or JPEG)"));
    }
    callback(null, true);
  },
}).single('avatar');

export const uploadAvatar = (req, res) => {
  upload(req, res, err => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message });
    }
    res.json({error: false, data: req.file.filename})
  });
};

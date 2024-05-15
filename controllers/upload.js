import multer from "multer";
import { UserModel } from "../models/user.js";
import fs from 'fs'

const BASE_URL = "http://localhost:1234";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "static/users-avatar");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5000000, // 5mb
  },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/)) {
      return callback(new Error("Please upload a Picture (PNG or JPEG)"));
    }
    callback(null, true);
  },
}).single("avatar");

export const uploadAvatar = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: true, message: err.message });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: true, message: "No file received" });
    }

    try {
      const id = req.user.id;
      if (!id) {
        return res
          .status(400)
          .json({ error: true, message: "User ID is required" });
      }
      const avatar = `${BASE_URL}/static/users-avatar/${req.file.filename}`;

      const userModel = new UserModel();

      const user = await userModel.getById({ id });
      const oldAvatarPath = user.avatar;

      const success = await userModel.updateAvatar({ id, avatar });

      if (success) {
        if (oldAvatarPath) {
          const oldAvatarFileName = oldAvatarPath.split("/").pop();
          fs.unlinkSync(`static/users-avatar/${oldAvatarFileName}`);
        }

        const updatedUser = await userModel.getById({ id });
        res.json({ error: false, data: updatedUser });
      } else {
        res.status(404).json({ error: true, message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ error: true, message: error.message });
    }
  });
};

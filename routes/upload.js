import { Router } from "express";
import { uploadAvatar } from "../controllers/upload.js";

export const createUploadRouter = () => {
  const uploadRouter = Router();

  uploadRouter.post("/", uploadAvatar);

  return uploadRouter;
};
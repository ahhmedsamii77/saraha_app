import multer from "multer";
import { nanoid } from "nanoid";
import os from "node:os";
export const allowedExtension = {
  image: ["image/png", "image/webp", "image/jpeg", "image/gif", "image/png"]
}
export function Multer(cusomExtension = []) {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
      cb(null, nanoid() + "-" + file.originalname);
    }
  });
  function fileFilter(req, file, cb) {
    if (!cusomExtension.includes(file.mimetype)) {
      cb(new Error("Invalid file type"));
    } else {
      cb(null, true);
    }
  }

  const uploads = multer({ storage, fileFilter });
  return uploads;
}
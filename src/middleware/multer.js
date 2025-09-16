import multer from "multer";

export const allowedExtension = {
  image: ["image/png", "image/webp", "image/jpeg", "image/gif", "image/png"]
}
export function Multer(cusomExtension = []) {
  const storage = multer.diskStorage({});
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
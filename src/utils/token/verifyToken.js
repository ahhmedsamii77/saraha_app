import jwt from "jsonwebtoken";
export function verifyToken({token , signature}) {
  return jwt.verify(token , signature);
}
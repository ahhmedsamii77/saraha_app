import jwt from "jsonwebtoken"
export function generateToken({payload , signature , options}) {
  return jwt.sign(payload, signature , options);
}
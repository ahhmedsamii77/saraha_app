import { revokeTokenModel } from "../DB/models/revokeToken.model.js";
import { userModel } from "../DB/models/user.model.js";
import { verifyToken } from "../utils/index.js";

export async function authentication(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("No token provided", { cause: 401 });
  }
  const [prefix, token] = authorization.split(" ");
  let signature = "";
  if (prefix == "bearer") {
    signature = process.env.ACCESS_TOKEN_USER
  } else if (prefix == "admin") {
    signature = process.env.ACCESS_TOKEN_ADMIN
  } else {
    throw new Error("Invalid token prefix", { cause: 400 });
  }

  const decoded = verifyToken({ token, signature });
  const isRevoked = await revokeTokenModel.findOne({ idToken: decoded.jti });
  if (isRevoked) {
    throw new Error("Please login again", { cause: 400 });
  }
  const user = await userModel.findOne({ _id: decoded.id });
  if (!user || user?.isDeleted) {
    throw new Error("user not found", { cause: 400 });
  }
  if (!user.confirmed) {
    throw new Error("Please check your email to confirm your account", { cause: 400 });
  }
  req.user = user;
  req.decoded = decoded;
  return next();
}
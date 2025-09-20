import { customAlphabet, nanoid } from "nanoid";
import { OAuth2Client } from "google-auth-library"
import { userModel, userProviders, userRoles } from "../../DB/models/user.model.js";
import cloudinary from "../../utils/cloudinary/index.js";
import { compare, decryption, encryption, eventEmitter, generateToken, hash, verifyToken } from "../../utils/index.js";
import { revokeTokenModel } from "../../DB/models/revokeToken.model.js";
import { otpModel } from "../../DB/models/otp.model.js";


// signup
export async function signUp(req, res, next) {
  const { name, email, password, age, phone, gender } = req.body;
  const isUserExists = await userModel.findOne({ email });
  if (isUserExists) {
    throw new Error("user already exists", { cause: 400 });
  }
  const hashPassword = await hash({ plaintext: password });
  const encryptionPhone = encryption({ plaintext: phone, secretkey: process.env.PHONE_KEY });
  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }
  const b64 = req.file.buffer.toString("base64");
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const { secure_url, public_id } = await cloudinary.uploader.upload(dataURI, {
    folder: "users"
  });
  const user = await userModel.create({
    name,
    email,
    password: hashPassword,
    age,
    phone: encryptionPhone,
    gender,
    profileImage: {
      secure_url,
      public_id
    }
  });
  eventEmitter.emit("confirmEmail", { email, id: user._id });

  return res.status(201).json({ message: "User created. Please check your email to confirm your account", user });
}


// confirm email
export async function confirmEmail(req, res, next) {
  const { email, otp } = req.body;
  const user = await userModel.findOne({ email: email, confirmed: false });
  if (!user) {
    throw new Error("user not found or already confirmed", { cause: 404 });
  }
  const otpInDb = await otpModel.findOne({ userId: user._id });
  if (!otpInDb) {
    throw new Error("otp not found", { cause: 404 });
  }
  if (user.isBanned) {
    const banTime = user.bannedAt + 5 * 60 * 1000;
    if (banTime > Date.now()) {
      const remainingTime = Math.ceil((banTime - Date.now()) / 1000);
      throw new Error("you are banned. Please try again in" + remainingTime + " seconds", { cause: 400 });
    } else {
      user.isBanned = false;
      user.bannedAt = null;
      await user.save();
      eventEmitter.emit("confirmEmail", { email, id: user._id });
      return res.status(200).json({ message: "otp sent to your email" });
    }
  }
  if (otpInDb.expiresAt < Date.now()) {
    eventEmitter.emit("confirmEmail", { email, id: user._id });
    throw new Error("otp expired and new code will be sent", { cause: 400 });
  }
  if (otpInDb.attempts > 5) {
    user.isBanned = true;
    user.bannedAt = Date.now();
    await user.save();
    throw new Error("you have reached the maximum number of attempts login afer 5 minutes to get new otp", { cause: 400 });
  }
  const isMatch = compare({ plaintext: otp, ciphertext: otpInDb.otp });
  if (!isMatch) {
    otpInDb.attempts++;
    await otpInDb.save();
    throw new Error("wrong otp", { cause: 409 });
  }
  await otpModel.deleteOne({ userId: user._id });
  user.confirmed = true;
  await user.save();
  return res.status(200).json({ message: "Email confirmed" });
}

// signin
export async function signIn(req, res, next) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email, confirmed: true });
  if (!user) {
    throw new Error("user not found or not confirmed", { cause: 404 });
  }
  if (!user.confirmed) {
    if (user.isBanned) {
      const banTime = user.bannedAt + 5 * 60 * 1000;
      if (banTime > Date.now()) {
        const remainingTime = Math.ceil((banTime - Date.now()) / 1000);
        throw new Error("you are banned. Please try again in" + remainingTime + " seconds", { cause: 400 });
      } else {
        user.isBanned = false;
        user.bannedAt = null;
        await user.save();
        eventEmitter.emit("confirmEmail", { email, id: user._id });
        return res.status(200).json({ message: "otp sent to your email" });
      }
    }
  }
  const isMatch = await compare({ plaintext: password, ciphertext: user.password });
  if (!isMatch) {
    throw new Error("wrong password", { cause: 409 });
  }
  const jwtid = nanoid();
  const access_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "2h", jwtid }
  });
  const refersh_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.REFERSH_TOKEN_USER : process.env.REFERSH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid }
  });
  return res.status(200).json({ message: "successful login", access_token, refersh_token });
}

// refersh token
export async function refershToken(req, res, next) {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("No token provided", { cause: 401 });
  }
  const [prefix, token] = authorization.split(" ");
  let signature = "";
  if (prefix == "bearer") {
    signature = process.env.REFERSH_TOKEN_USER
  } else if (prefix == "admin") {
    signature = process.env.REFERSH_TOKEN_ADMIN
  } else {
    throw new Error("Invalid token prefix", { cause: 400 });
  }

  const decoded = verifyToken({ token, signature });
  const user = await userModel.findOne({ _id: decoded.id });
  if (!user) {
    throw new Error("user not exist", { cause: 400 });
  }
  const jwtid = nanoid();
  const access_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "2h", jwtid }
  });
  const refersh_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.REFERSH_TOKEN_USER : process.env.REFERSH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid }
  });
  return res.status(200).json({ message: "success", access_token, refersh_token });
}
// revoke token
export async function revokeToken(req, res, next) {
  await revokeTokenModel.create({
    idToken: req.decoded.jti,
    expiresAt: req.decoded.exp
  });
  return res.status(200).json({ message: "success" });
}


// login with google
export async function loginWithGmail(req, res, next) {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID
    });
    const payload = ticket.getPayload();
    return payload;
  }

  const { given_name, email_verified, picture, email } = await verify();
  const user = await userModel.findOne({ email });
  if (!user) {
    user = await userModel.create({
      name: given_name,
      email,
      confirmed: email_verified,
      profileImage: {
        secure_url: picture
      },
      provider: userProviders.google
    });
    if (user.provider != userProviders.google) {
      throw new Error("Please login with system", { cause: 400 });
    }
    const jwtid = nanoid();
    const access_token = generateToken({
      payload: { id: user._id },
      signature: user.role == userRoles.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
      options: { expiresIn: "2h", jwtid }
    });
    const refersh_token = generateToken({
      payload: { id: user._id },
      signature: user.role == userRoles.user ? process.env.REFERSH_TOKEN_USER : process.env.REFERSH_TOKEN_ADMIN,
      options: { expiresIn: "1y", jwtid }
    });
    return res.status(200).json({ message: "successful login", access_token, refersh_token });
  }
}

// update password
export async function updatePassword(req, res, next) {
  const { oldPassword, newPassword } = req.body;
  const isMatch = compare({ plaintext: oldPassword, ciphertext: req.user.password });
  if (!isMatch) {
    throw new Error("wrong password", { cause: 409 });
  }
  const hashPassword = await hash({ plaintext: newPassword });
  req.user.password = hashPassword;
  await req.user.save();
  return res.status(200).json({ message: "success" });
}
// forget password
export async function forgetPassword(req, res, next) {
  const { email } = req.body;
  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  const otp = customAlphabet("0123456789", 4)();
  eventEmitter.emit("sendOtp", { email, otp });
  const hashOtp = await hash({ plaintext: otp });
  user.otp = hashOtp;
  await user.save();
  return res.status(200).json({ message: "Otp Sent to your email" });
}

// reset password
export async function resetPassword(req, res, next) {
  const { email, otp, newPassword } = req.body;
  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("user not found or wrong otp", { cause: 404 });
  }
  const isMatch = compare({ plaintext: otp, ciphertext: user.otp });
  if (!isMatch) {
    throw new Error("wrong otp", { cause: 409 });
  }
  const hashPassword = await hash({ plaintext: newPassword });
  await userModel.updateOne({ email }, {
    password: hashPassword,
    $unset: { otp: "" }
  });
  const jwtid = nanoid();
  const access_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.ACCESS_TOKEN_USER : process.env.ACCESS_TOKEN_ADMIN,
    options: { expiresIn: "2h", jwtid }
  });
  const refersh_token = generateToken({
    payload: { id: user._id },
    signature: user.role == userRoles.user ? process.env.REFERSH_TOKEN_USER : process.env.REFERSH_TOKEN_ADMIN,
    options: { expiresIn: "1y", jwtid }
  });
  return res.status(200).json({ message: "success" , access_token, refersh_token });
}
// updte profile
export async function updateProfile(req, res, next) {
  const { name, email, age, phone, gender } = req.body;
  if (name) {
    req.user.name = name;
  }
  if (age) {
    req.user.age = age;
  }
  if (gender) {
    req.user.gender = gender;
  }
  if (phone) {
    req.user.phone = encryption({ plaintext: phone, secretkey: process.env.PHONE_KEY });
  }
  if (email) {
    const user = await userModel.findOne({ email });
    if (user) {
      throw new Error("email already exist", { casue: 400 });
    }
    req.user.email = email;
    req.user.email.confirmed = false;
    eventEmitter.emit("confirmEmail", { email });
  }
  await req.user.save();
  return res.status(200).json({ message: "success", user: req.user });
}

// getprofile
export async function getProfile(req, res, next) {
  const { userId } = req.params;
  const user = await userModel.findById(userId).select("-password -confirmed -isDeleted -isBanned -provider");
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  return res.status(200).json({ message: "success", user });
}
// get user data
export async function getUserData(req, res, next) {
  const phone = decryption({ ciphertext: req.user.phone, secretkey: process.env.PHONE_KEY });
  req.user.phone = phone;
  return res.status(200).json({ message: "success", user: req.user });
}
// freeze account
export async function freezeAccoount(req, res, next) {
  const { userId } = req.params;
  if (userId && user.role != userRoles.admin) {
    throw new Error("you are not authorized for this process", { cause: 401 });
  }
  const user = await userModel.updateOne({ _id: userId || req.user._id, idDeleted: { $exists: false } }, {
    idDeleted: true,
    deletedBy: req.user._id
  });
  if (user.matchedCount == 0) {
    throw new Error("fail to freeze", { cause: 400 });
  }
  return res.status(200).json({ message: "success" });
}
// unfreeze account
export async function unfreezeAccoount(req, res, next) {
  const { userId } = req.params;
  if (userId && user.role != userRoles.admin) {
    throw new Error("you are not authorized for this process", { cause: 401 });
  }
  const user = await userModel.updateOne({ _id: userId || req.user._id, idDeleted: { $exists: true } }, {
    $unset: { idDeleted: "", deletedBy: "" }
  });
  if (user.matchedCount == 0) {
    throw new Error("fail to freeze", { cause: 400 });
  }
  return res.status(200).json({ message: "success" });
}

// update profile image
export async function updateProfileImage(req, res, next) {
  await cloudinary.uploader.destroy(req.user.profileImage.public_id);
  const b64 = req.file.buffer.toString("base64");
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  const { secure_url, public_id } = await cloudinary.uploader.upload(dataURI, {
    folder: "users"
  });
  req.user.profileImage = {
    secure_url,
    public_id
  }
  await req.user.save();
  return res.status(200).json({ message: "success", user: req.user });
}


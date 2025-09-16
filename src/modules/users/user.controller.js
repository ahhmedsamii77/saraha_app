import { Router } from "express";
import * as UV from "./user.validation.js"
import * as US from "./user.service.js"
import { allowedExtension, authentication, Multer, validation } from "../../middleware/index.js"
export const userRouter = Router();
userRouter.post("/signup", Multer(allowedExtension.image).single("image"), validation(UV.signupSchema), US.signUp);
userRouter.post("/confirm-email", US.confirmEmail);
userRouter.post("/signin", validation(UV.signinSchema), US.signIn);
userRouter.post("/refersh-token", US.refershToken);
userRouter.post("/revoke-token", authentication, US.revokeToken);
userRouter.post("/update-password", authentication, validation(UV.updatePasswordSchema), US.updatePassword);
userRouter.post("/forget-password", validation(UV.forgetPasswordSchema), US.forgetPassword);
userRouter.post("/reset-password", validation(UV.resetPasswordSchema), US.resetPassword);
userRouter.post("/update-profile", authentication, validation(UV.updateProfileSchema), US.updateProfile);
userRouter.get("/get-profile/:userId", validation(UV.getProfileSchema), US.getProfile);
userRouter.get("/getUserData", authentication, US.getUserData);
userRouter.delete("/freeze-account{/:userId}", authentication, US.freezeAccoount);
userRouter.delete("/unfreeze-account{/:userId}", authentication, US.unfreezeAccoount);
userRouter.patch("/update-profileImage", authentication, Multer(allowedExtension.image).single("image"), US.updateProfileImage);
import joi from "joi";
import { userGender, userRoles } from "../../DB/models/user.model.js";
import { customId, generalRules } from "../../utils/index.js";
export const signupSchema = {
  body: joi.object({
    name: joi.string().required(),
    email: generalRules.email.required(),
    password: generalRules.password.required(),
    cPassword: joi.string().required().valid(joi.ref("password")),
    age: joi.number().required().min(18).max(60),
    phone: joi.string().required().regex(/^(20)?01[0125][0-9]{8}$/),
    gender: joi.string().valid(userGender.male, userGender.female),
    role: joi.string().valid(userRoles.user, userRoles.admin),
    confirmed: joi.boolean()
  }).required()
}

export const signinSchema = {
  body: joi.object({
    email: generalRules.email.required(),
    password: generalRules.password.required(),
  }).required()
}


export const updatePasswordSchema = {
  body: joi.object({
    oldPassword: generalRules.password.required(),
    newPassword: generalRules.password.required(),
    cPassword: generalRules.password.required().valid(joi.ref("newPassword")),
  }).required()
}


export const forgetPasswordSchema = {
  body: joi.object({
    email: generalRules.email.required(),
  }).required()
}

export const resetPasswordSchema = {
  body: joi.object({
    email: generalRules.email.required(),
    otp: joi.string().length(4).required(),
    newPassword: generalRules.password.required(),
    cPassword: generalRules.password.required().valid(joi.ref("newPassword")),
  }).required()
}


export const updateProfileSchema = {
  body: joi.object({
    name: joi.string(),
    email: generalRules.email,
    age: joi.number().min(18).max(60),
    phone: joi.string().regex(/^(20)?01[0125][0-9]{8}$/),
    gender: joi.string().valid(userGender.male, userGender.female),
  })
}

export const getProfileSchema = {
  params: joi.object({
    userId: joi.string().custom(customId).required(),
  })
}
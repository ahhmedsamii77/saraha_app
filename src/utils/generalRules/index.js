import joi from "joi"
import mongoose from "mongoose"
export const generalRules = {
  email: joi.string().email(),
  password: joi.string().min(6),
  id: joi.string().custom(customId)
}


export function customId(value , helper) {
  const data = mongoose.Types.ObjectId.isValid(value);
  return data ? value : helper.message("Invalid id");
}
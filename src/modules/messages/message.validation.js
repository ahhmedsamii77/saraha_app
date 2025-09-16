import joi from "joi";
import { generalRules } from "../../utils/index.js"
export const createMessageSchema = {
  body: joi.object({
    userId: generalRules.id.required(),
    content: joi.string().required().min(1)
  }).required()
}

export const getMessageSchema = {
  params: joi.object({
    messageId: generalRules.id.required(),
  }).required()
}
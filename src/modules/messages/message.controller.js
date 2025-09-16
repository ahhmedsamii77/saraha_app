import { Router } from "express";
import * as MS from "./message.service.js";
import * as MV from "./message.validation.js"
import { authentication, validation } from "../../middleware/index.js"
export const messageRouter = Router();

messageRouter.post("/send-message", validation(MV.createMessageSchema), MS.createMessage);
messageRouter.get("/", authentication, MS.getAllMessages);
messageRouter.get("/:messageId", authentication, validation(MV.getMessageSchema), MS.getMessage);


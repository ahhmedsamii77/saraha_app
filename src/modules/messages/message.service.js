import { userModel } from "../../DB/models/user.model.js";
import { messageModel } from "../../DB/models/message.model.js";

// create message
export async function createMessage(req, res, next) {
  const { userId, content } = req.body;
  const user = await userModel.findOne({ _id: userId, isDeleted: { $exists: false } });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  const msg = await messageModel.create({ userId, content });
  return res.status(201).json({ message: "created", msg });
}
// get All messages
export async function getAllMessages(req, res, next) {
  const messages = await messageModel.find({ userId: req.user._id }).populate([
    { path: "userId" }
  ]);
  return res.status(200).json({ message: "success", messages });
}

// get specific message
export async function getMessage(req, res, next) {
  console.log(req.user._id)
  const { messageId } = req.params;
  const msg = await messageModel.findOne({ _id: messageId, userId: req.user._id });
  if (!msg) {
    throw new Error("message not found", { cause: 404 });
  }
  return res.status(200).json({ message: "success", msg });
}
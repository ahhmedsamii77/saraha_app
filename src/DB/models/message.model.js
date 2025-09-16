import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "users",
    required: true,
  }
}, {
  timestamps: true
});

export const messageModel = mongoose.models.messages || mongoose.model("messages", messageSchema);
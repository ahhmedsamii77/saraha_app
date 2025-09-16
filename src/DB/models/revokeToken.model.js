import mongoose from "mongoose";

const revokeTokenSchema = new mongoose.Schema({
  idToken: {
    type: String,
    required: true
  },
  expiresAt: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

export const revokeTokenModel = mongoose.models.revokeTokens || mongoose.model("revokeTokens", revokeTokenSchema);
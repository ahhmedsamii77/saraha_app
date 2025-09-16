import mongoose from "mongoose";
export const userGender = {
  male: "male",
  female: "female",
}
export const userRoles = {
  user: "user",
  admin: "admin",
}
export const userProviders = {
  system: "system",
  google: "google",
}
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profileImage: {
    public_id: String,
    secure_url: String
  },
  otp: String,
  password: {
    type: String,
    required: () => {
      this?.provider == userProviders.system ? true : false
    }
  },
  phone: {
    type: String,
    required: () => {
      this?.provider == userProviders.system ? true : false
    }
  },
  age: {
    type: String,
    required: () => {
      this?.provider == userProviders.system ? true : false
    }
  },
  gender: {
    type: String,
    enum: Object.values(userGender),
    default: userGender.male
  },
  role: {
    type: String,
    enum: Object.values(userRoles),
    default: userRoles.user
  },
  idDeleted: Boolean,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  bannedAt: Date,
  provider: {
    type: String,
    enum: Object.values(userProviders),
    default: userProviders.system
  },
  confirmed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const userModel = mongoose.models.users || mongoose.model("users", userSchema);
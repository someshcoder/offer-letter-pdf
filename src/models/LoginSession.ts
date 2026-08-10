import mongoose, { Schema } from "mongoose";
import { ACCESS_ROLES } from "@/types/employee";

const LoginSessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    mobileNumber: { type: String, default: "" },
    role: { type: String, enum: ACCESS_ROLES, required: true, index: true },
    loginAt: { type: Date, required: true, default: Date.now, index: true },
    logoutAt: { type: Date, default: null },
    lastSeenAt: { type: Date, required: true, default: Date.now, index: true },
    durationSeconds: { type: Number, default: 0 },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

LoginSessionSchema.index({ role: 1, loginAt: -1 });
LoginSessionSchema.index({ active: 1, lastSeenAt: -1 });

const LoginSession =
  mongoose.models.LoginSession || mongoose.model("LoginSession", LoginSessionSchema);

export default LoginSession;

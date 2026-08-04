import mongoose, { Schema, model, models } from "mongoose";

const ApiKeySchema = new Schema({
  userId: { type: String, required: true },
  key: { type: String, required: true, unique: true },
  status: { type: String, default: "active" },
  plan: { type: String, default: "monthly" },
  limits: {
    requestsPerMinute: { type: Number, default: 60 },
    ttsPerDay: { type: Number, default: 500 },
  },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

export default models.ApiKey || model("ApiKey", ApiKeySchema);

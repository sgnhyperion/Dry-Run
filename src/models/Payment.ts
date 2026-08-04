import mongoose, { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema({
  userId: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, default: "success" },
  createdAt: { type: Date, default: Date.now },
});

export default models.Payment || model("Payment", PaymentSchema);

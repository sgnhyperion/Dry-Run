import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import connectToDatabase from "@/lib/mongo";
import Payment from "@/models/Payment";
import ApiKey from "@/models/ApiKey";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!userId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    await connectToDatabase();

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // ✅ Store Payment in Mongo
    const payment = await Payment.create({
      userId,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: 100000,
      currency: "INR",
      status: "success",
    });

    // ✅ Generate API Key
    const apiKey = `mk_live_${uuidv4().replace(/-/g, "")}`;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // ✅ Store API Key in Mongo
    const keyDoc = await ApiKey.create({
      userId,
      key: apiKey,
      status: "active",
      plan: "monthly",
      limits: { requestsPerMinute: 60, ttsPerDay: 500 },
      expiresAt,
    });

    return res.json({
      success: true,
      apiKey,
      expiresAt,
    });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
}

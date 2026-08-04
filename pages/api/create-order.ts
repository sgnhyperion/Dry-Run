import type { NextApiRequest, NextApiResponse } from "next";
import Razorpay from "razorpay";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const { userId } = req.body;

    const amount = 1000000; // ₹1000
    const currency = "INR";

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `order_${userId}`,
    });

    res.status(200).json({
      orderId: order.id,
      amount,
      currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Order error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
}

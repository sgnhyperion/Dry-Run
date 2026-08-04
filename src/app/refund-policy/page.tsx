import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Mimichat",
  description: "Refund policy for Mimichat digital avatar purchases.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Refund Policy</h1>
        <p className="text-sm opacity-70">Last Updated: 13/02/2026</p>

        <p>
          All purchases on Mimichat are for digital products (paid avatars).
        </p>

        <p className="font-semibold">
          All sales are final. No refunds will be issued once avatar access
          has been granted.
        </p>

        <h2 className="text-xl font-semibold">Refund Exceptions</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Payment made but avatar access not granted due to technical issue.</li>
          <li>Duplicate payment transactions.</li>
        </ul>

        <p>
          For assistance, contact satyam@mimichat.space within 48 hours
          of purchase.
        </p>

        <p>
          Approved refunds will be processed within 7–10 business days.
        </p>
      </div>
    </div>
  );
}

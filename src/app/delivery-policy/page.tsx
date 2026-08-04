import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Policy | Mimichat",
  description: "Delivery policy for Mimichat digital products.",
};

export default function DeliveryPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Delivery Policy</h1>
        <p className="text-sm opacity-70">Last Updated: 13/02/2026</p>

        <p>
          Mimichat sells digital products only. No physical items are shipped.
        </p>

        <h2 className="text-xl font-semibold">Access Timeline</h2>
        <p>
          Upon successful payment, avatar access is granted instantly
          or within a few minutes.
        </p>

        <p>
          In rare cases of technical delays, access will be provided within 24 hours.
        </p>

        <p>
          If you do not receive access, please contact satyam@mimichat.space
          with your transaction ID.
        </p>
      </div>
    </div>
  );
}

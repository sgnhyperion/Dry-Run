import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Mimichat",
  description: "Terms and conditions for using Mimichat paid avatars.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Terms & Conditions</h1>
        <p className="text-sm opacity-70">Last Updated: 13/02/2026</p>

        <h2 className="text-xl font-semibold">1. Nature of Service</h2>
        <p>
          Mimichat provides digital 3D avatar-based communication services.
          All paid avatars are digital products.
        </p>

        <h2 className="text-xl font-semibold">2. License</h2>
        <p>
          Purchased avatars are granted as a non-transferable, non-exclusive
          license for use within the Mimichat platform only.
        </p>

        <h2 className="text-xl font-semibold">3. No Resale</h2>
        <p>
          Users may not resell, redistribute, or commercially exploit avatars
          outside the platform.
        </p>

        <h2 className="text-xl font-semibold">4. Payments</h2>
        <p>
          Payments are processed securely through third-party gateways.
          We do not store payment details.
        </p>

        <h2 className="text-xl font-semibold">5. Account Responsibility</h2>
        <p>
          Users are responsible for maintaining account security and login credentials.
        </p>

        <h2 className="text-xl font-semibold">6. Termination</h2>
        <p>
          We reserve the right to suspend accounts violating our policies.
        </p>

        <h2 className="text-xl font-semibold">7. Modifications</h2>
        <p>
          These terms may be updated at any time. Continued use implies acceptance.
        </p>
      </div>
    </div>
  );
}

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Mimichat",
  description: "Privacy policy explaining how Mimichat handles user data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-sm opacity-70">Last Updated: 13/02/2026</p>

        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Email address (for account creation)</li>
          <li>Login information (including Google authentication)</li>
          <li>Payment transaction details (processed via third-party gateways)</li>
        </ul>

        <h2 className="text-xl font-semibold">2. How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>To provide avatar access</li>
          <li>To improve platform experience</li>
          <li>To process transactions securely</li>
        </ul>

        <h2 className="text-xl font-semibold">3. Payment Security</h2>
        <p>
          Payments are processed through secure third-party providers.
          We do not store card or banking information.
        </p>

        <h2 className="text-xl font-semibold">4. Data Protection</h2>
        <p>
          We take reasonable measures to protect user data from unauthorized access.
        </p>

        <h2 className="text-xl font-semibold">5. Policy Updates</h2>
        <p>
          This policy may be updated periodically. Continued use of the platform
          indicates acceptance of changes.
        </p>
      </div>
    </div>
  );
}

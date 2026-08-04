import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Mimichat",
  description: "Contact Mimichat for support regarding payments and avatars.",
};

export default function ContactUsPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-white dark:bg-black text-gray-800 dark:text-gray-200">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">Contact Us</h1>

        <p>
          If you have any questions regarding purchases, payments, or avatar access,
          feel free to contact us.
        </p>

        <div className="space-y-2">
          <p><strong>Email:</strong> satyam@mimichat.space</p>
          <p><strong>Website:</strong> https://mimichat.space</p>
          <p><strong>Support Hours:</strong> Monday to Saturday, 10 AM – 6 PM IST</p>
        </div>

        <p>We aim to respond within 24–48 hours.</p>
      </div>
    </div>
  );
}

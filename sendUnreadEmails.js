// sendUnreadDigest.js
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase
const serviceAccount = require("./see-you-7ffec-firebase-adminsdk-ntqnb-617184660b.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Config
const INACTIVE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days inactivity
const DIGEST_INTERVAL_MS = 48 * 60 * 60 * 1000; // 48 hours between digests

// Helper to safely get lastSeen in milliseconds
function getLastSeenMs(lastSeen) {
  if (!lastSeen) return 0;
  if (typeof lastSeen.toMillis === "function") return lastSeen.toMillis(); // Firestore Timestamp
  if (lastSeen instanceof Date) return lastSeen.getTime();                  // JS Date
  if (typeof lastSeen === "number") return lastSeen;                        // already ms
  return 0;
}

async function sendUnreadDigest() {
  const usersSnapshot = await db.collection("users").get();
  const now = Date.now();

  for (const userDoc of usersSnapshot.docs) {
    const user = userDoc.data();
    const lastSeenMs = getLastSeenMs(user.lastSeen);

    const isInactive = !user.online && (now - lastSeenMs > INACTIVE_MS);

    // Skip users without email, digest disabled, or not inactive
    if (!user.email || !user.digestEnabled || !isInactive) continue;

    // Skip if digest was already sent within 48 hours
    const lastDigestMs = user.lastDigestSent ? getLastSeenMs(user.lastDigestSent) : 0;
    if (now - lastDigestMs < DIGEST_INTERVAL_MS) continue;

    // Fetch unread messages
    const unreadSnapshot = await db.collection("messages")
      .where("receiver", "==", user.uid)
      .where("seen", "==", false)
      .get();

    if (unreadSnapshot.empty) continue;

    // Count unique senders by username
    const senderUsernames = new Set();
    for (const msg of unreadSnapshot.docs) {
      const msgData = msg.data();
      try {
        const senderDoc = await db.collection("users").doc(msgData.sender).get();
        const senderName = senderDoc.exists ? senderDoc.data().username : "Someone";
        senderUsernames.add(senderName);
      } catch (err) {
        senderUsernames.add("Someone");
      }
    }
    const senderList = Array.from(senderUsernames).join(", ");

    // Build HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2>👾 Hello ${user.username},</h2>
        <p>You have <strong>${unreadSnapshot.size} unread messages</strong> from <strong>${senderUsernames.size}</strong> people.</p>
        <p>Senders: ${senderList}</p>
        <p>
          <a href="https://mimichat.space" 
             style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:5px;">
             👾 Open Mimichat
          </a>
        </p>
        <p style="font-size:12px;color:#666;">This is an automated notification because you have unread messages. You will receive this only once every 48 hours.</p>
      </div>
    `;

    const email = {
      to: user.email,
      from: {
        email: "no-reply@mimichat.space",
        name: "Mimichat"
      },
      name: "Mimichat 👾",
      subject: `📨 ${unreadSnapshot.size} unread messages on Mimichat`,
      text: `Hi ${user.username}, you have ${unreadSnapshot.size} unread messages from ${senderUsernames.size} people. Open Mimichat to read them.`,
      html: htmlContent
    };

    try {
      await sgMail.send(email);
      console.log(`Digest email sent to ${user.email}`);

      // Update lastDigestSent timestamp
      await db.collection("users").doc(userDoc.id).update({
        lastDigestSent: admin.firestore.Timestamp.now()
      });
    } catch (err) {
      console.error(`Error sending email to ${user.email}:`, err.response ? err.response.body : err);
    }
  }
}

// Run once immediately, then every 12 hours
sendUnreadDigest();
setInterval(sendUnreadDigest, 12 * 60 * 60 * 1000);

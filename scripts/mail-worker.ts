import { loadEnvFile } from "node:process";
try {
  loadEnvFile(".env.local");
} catch {
  /* environment may already be populated */
}
const { db, transaction } = await import("../lib/server/db");
const { decrypt } = await import("../lib/server/crypto");
const { mailTransport, requireMail } = await import("../lib/server/mail");
requireMail();
const transport = mailTransport();
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
console.log("Pinna email worker running. Message contents are never logged.");
while (!stopping) {
  const sent = await transaction(async (client) => {
    const { rows } = await client.query(
      "SELECT * FROM mail_outbox WHERE sent_at IS NULL AND attempts < 8 AND next_attempt_at <= now() ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    const mail = rows[0];
    if (!mail) return false;
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: mail.recipient,
        subject: mail.subject,
        text: decrypt(mail.encrypted_body),
        messageId: `<pinna-${mail.id}@${new URL(process.env.APP_ORIGIN!).hostname}>`,
      });
      await client.query(
        "UPDATE mail_outbox SET sent_at=now(),encrypted_body='',attempts=attempts+1 WHERE id=$1",
        [mail.id],
      );
    } catch {
      await client.query(
        "UPDATE mail_outbox SET attempts=attempts+1,next_attempt_at=now()+(power(2,attempts)*interval '1 minute') WHERE id=$1",
        [mail.id],
      );
      console.error(`Email delivery deferred for outbox item ${mail.id}.`);
    }
    return true;
  });
  if (!sent) await new Promise((resolve) => setTimeout(resolve, 2000));
}
await db().end();

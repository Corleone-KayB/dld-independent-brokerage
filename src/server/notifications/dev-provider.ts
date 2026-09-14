import type { NotificationPayload, NotificationProvider, NotificationRecipient } from "./provider";

function log(channel: string, to: NotificationRecipient, payload: NotificationPayload) {
  console.log(`[notifications:${channel}]`, {
    to,
    subject: payload.subject,
    body: payload.body,
    metadata: payload.metadata,
  });
}

/** Development provider: logs instead of sending. Never fabricates delivery status. */
export const devNotificationProvider: NotificationProvider = {
  async email(to, payload) {
    log("email", to, payload);
  },
  async sms(to, payload) {
    log("sms", to, payload);
  },
  async whatsapp(to, payload) {
    log("whatsapp", to, payload);
  },
  async inApp(to, payload) {
    log("in-app", to, payload);
  },
};

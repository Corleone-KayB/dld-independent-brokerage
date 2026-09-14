import { devNotificationProvider } from "./dev-provider";

export type {
  NotificationProvider,
  NotificationPayload,
  NotificationRecipient,
} from "./provider";

// Extension point: swap for a production email/SMS/WhatsApp provider.
export const notifications = devNotificationProvider;

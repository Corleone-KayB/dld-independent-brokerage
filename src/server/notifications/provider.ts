export interface NotificationRecipient {
  email?: string;
  phone?: string;
  userId?: string;
}

export interface NotificationPayload {
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Notification abstraction. MVP ships a development provider that logs
 * safely instead of dispatching real email/SMS/WhatsApp — swapping in a
 * real email/SMS/WhatsApp API provider must not require changing callers.
 */
export interface NotificationProvider {
  email(to: NotificationRecipient, payload: NotificationPayload): Promise<void>;
  sms(to: NotificationRecipient, payload: NotificationPayload): Promise<void>;
  whatsapp(to: NotificationRecipient, payload: NotificationPayload): Promise<void>;
  inApp(to: NotificationRecipient, payload: NotificationPayload): Promise<void>;
}

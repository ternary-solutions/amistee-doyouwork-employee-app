export interface Preference {
  id: string;
  user_id: string;
  job_updates: boolean;
  company_announcements: boolean;
  weekend_overtime_alerts: boolean;
  job_reminders: boolean;
  expense_updates: boolean;
  spiff_notifications: boolean;
  delivery_method: PreferenceDeliveryMethod;
}

export type PreferenceDeliveryMethod =
  | 'in_app'
  | 'in_app_email'
  | 'in_app_email_sms';

export interface PreferenceUpdate {
  job_updates?: boolean;
  company_announcements?: boolean;
  weekend_overtime_alerts?: boolean;
  job_reminders?: boolean;
  expense_updates?: boolean;
  spiff_notifications?: boolean;
  delivery_method?: PreferenceDeliveryMethod;
}

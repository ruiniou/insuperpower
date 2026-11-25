import './feedbackTone.css';

export type FeedbackTone = 'warning' | 'error' | 'success' | 'info';

export const FEEDBACK_ICON: Record<FeedbackTone, string> = {
  warning: 'ri-error-warning-fill',
  error: 'ri-close-circle-fill',
  success: 'ri-checkbox-circle-fill',
  info: 'ri-information-fill',
};

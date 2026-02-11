import { toast as rnToast } from '@backpackapp-io/react-native-toast';

/**
 * Toast notifications for success and error feedback.
 * Use instead of Alert.alert for non-blocking feedback.
 */
export const toast = {
  success: (message: string) => {
    rnToast.success(message);
  },
  error: (message: string) => {
    rnToast.error(message);
  },
  message: (message: string) => {
    rnToast(message);
  },
};

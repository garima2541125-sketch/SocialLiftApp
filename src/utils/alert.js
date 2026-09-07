import { Alert, Platform } from 'react-native';

// react-native-web's Alert.alert() is a no-op — it silently does nothing.
// On web, fall back to the browser's own alert() so messages are still seen.
export function showAlert(title, message) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }

  Alert.alert(title, message);
}

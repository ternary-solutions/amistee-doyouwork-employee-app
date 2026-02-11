import {
  background,
  card,
  foreground,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  typography,
} from '@/constants/theme';
import { getMediaUrl } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  url: string | null;
  title: string;
}

/**
 * Renders a document (PDF, image, etc.) in an in-app modal with WebView.
 * Uses Google Docs viewer on Android for PDFs to improve compatibility.
 */
export function DocumentViewerModal({
  visible,
  onClose,
  url,
  title,
}: DocumentViewerModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const fullUrl = url?.trim()
    ? (url.startsWith('http') ? url : getMediaUrl(url))
    : null;

  // On Android, PDFs often fail to render in WebView; use Google Docs viewer
  const isPdf = fullUrl?.toLowerCase().includes('.pdf') ?? false;
  const viewerUrl =
    fullUrl && Platform.OS === 'android' && isPdf
      ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
      : fullUrl;

  const handleLoadEnd = useCallback(() => {
    setLoading(false);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
            accessibilityLabel="Close"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={24} color={primaryForeground} />
          </Pressable>
        </View>

        {viewerUrl ? (
          <View style={styles.webViewWrap}>
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={primary} />
                <Text style={styles.loadingText}>Loading document...</Text>
              </View>
            )}
            <WebView
              source={{ uri: viewerUrl }}
              style={styles.webView}
              onLoadEnd={handleLoadEnd}
              onLoadStart={() => setLoading(true)}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled
              startInLoadingState
              scalesPageToFit
            />
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={mutedForeground} />
            <Text style={styles.emptyText}>No document to display</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: card,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  title: {
    ...typography.title,
    color: foreground,
    flex: 1,
    marginRight: spacing.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: primary,
  },
  webViewWrap: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: mutedForeground,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: mutedForeground,
  },
});

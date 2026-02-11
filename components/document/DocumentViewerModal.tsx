import {
    background,
    border,
    card,
    foreground,
    mutedForeground,
    primary,
    primaryForeground,
    spacing,
    typography,
} from '@/constants/theme';
import { getMediaUrl } from '@/utils/api';
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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

function getFilenameFromUrl(url: string, title: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (last && last.includes('.')) return last;
  } catch {
    // ignore
  }
  const ext = url?.toLowerCase().includes('.pdf') ? '.pdf' : '.bin';
  return `${title.replace(/\s+/g, '-')}${ext}`;
}

/**
 * Renders a document (PDF, image, etc.) in an in-app modal with WebView.
 * Uses Google Docs viewer on Android for PDFs to improve compatibility.
 * Supports Download and Open in App via expo-file-system and expo-sharing.
 */
export function DocumentViewerModal({
  visible,
  onClose,
  url,
  title,
}: DocumentViewerModalProps) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [opening, setOpening] = useState(false);

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

  const downloadAndShare = useCallback(async () => {
    if (!fullUrl) return;
    const filename = getFilenameFromUrl(fullUrl, title);
    const destDir = new Directory(Paths.cache, 'Documents');
    try {
      destDir.create();
    } catch {
      // may already exist
    }
    const destFile = new File(destDir, filename);
    try {
      await File.downloadFileAsync(fullUrl, destFile, { idempotent: true });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destFile.uri, {
          mimeType: isPdf ? 'application/pdf' : undefined,
          dialogTitle: title,
        });
      } else {
        toast.success('Document saved to app cache.');
      }
    } catch (error) {
      console.error('[DocumentViewerModal] Download/share error:', error);
      Alert.alert('Error', 'Failed to download or open document.');
    }
  }, [fullUrl, title, isPdf]);

  const handleDownload = useCallback(async () => {
    if (!fullUrl) return;
    setDownloading(true);
    try {
      await downloadAndShare();
    } finally {
      setDownloading(false);
    }
  }, [fullUrl, downloadAndShare]);

  const handleOpenInApp = useCallback(async () => {
    if (!fullUrl || Platform.OS === 'web') return;
    setOpening(true);
    try {
      await downloadAndShare();
    } finally {
      setOpening(false);
    }
  }, [fullUrl, downloadAndShare]);

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
          <>
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
            <View style={[styles.actionsRow, { paddingBottom: insets.bottom + spacing.md }]}>
              {Platform.OS !== 'web' && (
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnOutline, (loading || opening) && styles.actionBtnDisabled]}
                  onPress={handleOpenInApp}
                  disabled={loading || opening}
                >
                  <Ionicons name="open-outline" size={20} color={primary} />
                  <Text style={styles.actionBtnTextOutline}>
                    {opening ? 'Opening...' : 'Open in App'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.actionBtn, (loading || downloading) && styles.actionBtnDisabled]}
                onPress={handleDownload}
                disabled={loading || downloading}
              >
                <Ionicons name="download-outline" size={20} color={primaryForeground} />
                <Text style={styles.actionBtnText}>
                  {downloading ? 'Downloading...' : 'Download'}
                </Text>
              </Pressable>
            </View>
          </>
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
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: border,
    backgroundColor: card,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 8,
    backgroundColor: primary,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: primary,
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: primaryForeground },
  actionBtnTextOutline: { fontSize: 16, fontWeight: '600', color: primary },
});

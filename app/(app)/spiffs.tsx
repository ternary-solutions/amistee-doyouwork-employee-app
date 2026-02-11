import {
  background,
  border,
  card,
  destructive,
  foreground,
  muted,
  mutedForeground,
  primary,
  primaryForeground,
  radius,
  spacing,
  success,
} from '@/constants/theme';
import { mediaService } from '@/services/media';
import { spiffsService } from '@/services/spiffs';
import type { Spiff } from '@/types/spiffs';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { FormModal } from '@/components/ui/FormModal';
import { ListCard } from '@/components/ui/ListCard';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_COLORS: Record<string, string> = {
  Pending: mutedForeground,
  Approved: primary,
  Denied: destructive,
  Paid: success,
};

export default function SpiffsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [spiffs, setSpiffs] = useState<Spiff[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [typeId, setTypeId] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<{ uri: string; uploading?: boolean }[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, typesRes] = await Promise.all([
        spiffsService.list(1, 50),
        spiffsService.listTypes(),
      ]);
      setSpiffs(listRes?.items ?? []);
      setTypes(typesRes?.map((t) => ({ id: t.id, name: t.name })) ?? []);
    } catch (error) {
      console.error('Failed to load spiffs', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!modalOpen) {
      setAttachments([]);
    }
  }, [modalOpen]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerAction: { label: 'New spiff', onPress: () => setModalOpen(true) },
    });
  }, [navigation]);

  const pickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to add attachments.',
          [{ text: 'OK' }]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;
      const newAttachments = result.assets.map((a) => ({ uri: a.uri, uploading: false }));
      setAttachments((prev) => [...prev, ...newAttachments].slice(0, 10));
    } catch (error) {
      console.error('Pick image failed', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreate = async () => {
    if (!typeId || !date || !amount.trim()) return;
    try {
      setSubmitting(true);
      const attachmentUrls: string[] = [];
      for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];
        setAttachments((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, uploading: true } : a))
        );
        try {
          const filename = att.uri.split('/').pop() || 'photo.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          const res = await mediaService.uploadFile(
            { uri: Platform.OS === 'web' ? att.uri : att.uri, type, name: filename },
            'spiffs',
            'images'
          );
          attachmentUrls.push(res.file_url);
        } catch (err) {
          console.error('Upload attachment failed', err);
        }
        setAttachments((prev) =>
          prev.map((a, idx) => (idx === i ? { ...a, uploading: false } : a))
        );
      }
      await spiffsService.create({
        spiff_type_id: typeId,
        spiff_date: date,
        amount: Number(amount) || amount,
        details: details.trim() || undefined,
        ...(attachmentUrls.length > 0 && { attachment_urls: attachmentUrls }),
      });
      setModalOpen(false);
      setTypeId('');
      setDate('');
      setAmount('');
      setDetails('');
      setAttachments([]);
      load();
    } catch (error) {
      console.error('Create spiff failed', error);
      Alert.alert('Error', 'Failed to create spiff. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPaid = spiffs.filter((s) => s.status === 'Paid' && s.amount).reduce((sum, s) => sum + Number(s.amount), 0);

  if (loading && spiffs.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  return (
    <>
      {totalPaid > 0 && (
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total earned (Paid)</Text>
          <Text style={styles.totalAmount}>${totalPaid.toFixed(2)}</Text>
        </View>
      )}
      {spiffs.length === 0 ? (
        <View style={[styles.fill, { paddingBottom: insets.bottom }]}>
          <EmptyState message="No spiffs yet." />
        </View>
      ) : (
        <FlatList
          data={spiffs}
          keyExtractor={(s) => s.id}
          style={{ backgroundColor: background }}
          contentContainerStyle={[styles.list, { paddingBottom: spacing.xl + insets.bottom }]}
          renderItem={({ item }) => (
            <View style={styles.cardWrap}>
              <ListCard
                title={item.spiff_type?.name ?? 'Spiff'}
                meta={[`${new Date(item.spiff_date).toLocaleDateString()} · $${item.amount}`]}
                badge={{ text: item.status, backgroundColor: STATUS_COLORS[item.status] ?? mutedForeground }}
              >
                {item.details ? <Text style={styles.details} numberOfLines={2}>{item.details}</Text> : null}
              </ListCard>
            </View>
          )}
        />
      )}
      <FormModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New spiff"
        submitLabel="Submit"
        submitting={submitting}
        onSubmit={handleCreate}
      >
        <Text style={styles.label}>Type</Text>
        <View style={styles.picker}>
          {types.map((t) => (
            <Pressable key={t.id} style={[styles.pickerOption, typeId === t.id && styles.pickerOptionActive]} onPress={() => setTypeId(t.id)}>
              <Text style={[styles.pickerOptionText, typeId === t.id && styles.pickerOptionTextActive]}>{t.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
        <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="2025-02-15" />
        <Text style={styles.label}>Amount</Text>
        <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" />
        <Text style={styles.label}>Details (optional)</Text>
        <TextInput style={[styles.input, styles.textArea]} value={details} onChangeText={setDetails} placeholder="Details" multiline />
        <Text style={styles.label}>Attachments (optional)</Text>
        <Pressable
          style={[styles.attachBtn, (submitting || attachments.length >= 10) && styles.attachBtnDisabled]}
          onPress={pickImage}
          disabled={submitting || attachments.length >= 10}
        >
          <Ionicons name="camera" size={20} color={primary} />
          <Text style={styles.attachBtnText}>
            {attachments.length >= 10 && 'Max 10' || 'Add photo'}
          </Text>
        </Pressable>
        {attachments.length > 0 && (
          <View style={styles.attachmentGrid}>
            {attachments.map((att, i) => (
              <View key={i} style={styles.attachmentWrap}>
                <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                {att.uploading && (
                  <View style={styles.attachmentOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
                <Pressable
                  style={styles.attachmentRemove}
                  onPress={() => removeAttachment(i)}
                  disabled={att.uploading}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </FormModal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fill: { flex: 1, backgroundColor: background },
  totalCard: { marginHorizontal: spacing.base, marginBottom: spacing.base, padding: spacing.base, backgroundColor: '#f0fdf4', borderRadius: radius.base },
  totalLabel: { fontSize: 13, color: mutedForeground },
  totalAmount: { fontSize: 22, fontWeight: '700', color: success },
  list: { padding: spacing.base, paddingBottom: spacing.xl },
  cardWrap: { marginBottom: spacing.md },
  details: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: foreground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  textArea: { minHeight: 60 },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  pickerOption: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: muted },
  pickerOptionActive: { backgroundColor: primary },
  pickerOptionText: { fontSize: 14, color: foreground },
  pickerOptionTextActive: { color: primaryForeground },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  attachBtnDisabled: { opacity: 0.6 },
  attachBtnText: { fontSize: 14, fontWeight: '500', color: primary },
  attachmentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  attachmentWrap: { position: 'relative', width: 72, height: 72 },
  attachmentThumb: { width: 72, height: 72, borderRadius: radius.sm },
  attachmentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentRemove: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

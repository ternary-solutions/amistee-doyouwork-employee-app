import {
    background,
    border,
    card,
    destructive,
    destructiveMuted,
    foreground,
    mutedForeground,
    primary,
    primaryForeground,
    radius,
    spacing,
    typography,
} from '@/constants/theme';
import { preferencesService } from '@/services/preferences';
import { usersService } from '@/services/users';
import { useMainStore } from '@/store/main';
import type { Preference } from '@/types/preferences';
import { getMediaUrl, logout } from '@/utils/api';
import { toast as showToast } from '@/utils/toast';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const me = useMainStore((state) => state.me);
  const setMe = useMainStore((state) => state.setMe);

  const [preferences, setPreferences] = useState<Preference | null>(null);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Edit form state
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      setLoadingPrefs(true);
      const prefs = await preferencesService.load();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences', error);
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (me && editModalOpen) {
      setEditFirst(me.first_name || '');
      setEditLast(me.last_name || '');
      setEditPhone(me.phone_number || '');
      setEditEmail(me.email || '');
      setEditDob(me.date_of_birth || '');
      setEditEmergencyName(me.emergency_contact_name || '');
      setEditEmergencyPhone(me.emergency_contact_phone || '');
      setEditAddress(me.address || '');
    }
  }, [me, editModalOpen]);

  const handleSavePreferences = useCallback(async () => {
    if (!preferences) return;
    try {
      setSavingPrefs(true);
      await preferencesService.update({
        job_updates: preferences.job_updates,
        company_announcements: preferences.company_announcements,
        weekend_overtime_alerts: preferences.weekend_overtime_alerts,
        delivery_method: preferences.delivery_method,
        job_reminders: preferences.job_reminders,
        expense_updates: preferences.expense_updates,
        spiff_notifications: preferences.spiff_notifications,
      });
      showToast.success('Preferences saved.');
    } catch (error) {
      console.error('Failed to save preferences', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSavingPrefs(false);
    }
  }, [preferences]);

  const handlePrefToggle = useCallback(
    (
      key:
        | 'job_updates'
        | 'company_announcements'
        | 'weekend_overtime_alerts'
        | 'job_reminders'
        | 'expense_updates'
        | 'spiff_notifications',
      value: boolean
    ) => {
      if (!preferences) return;
      setPreferences({ ...preferences, [key]: value });
    },
    [preferences]
  );

  const handleDeliveryMethodChange = useCallback(
    (value: 'in_app' | 'in_app_email' | 'in_app_email_sms') => {
      if (!preferences) return;
      setPreferences({ ...preferences, delivery_method: value });
    },
    [preferences]
  );

  const handleSaveEdit = useCallback(async () => {
    if (!me?.id) return;
    try {
      setEditSaving(true);
      const updated = await usersService.update(me.id, {
        first_name: editFirst.trim(),
        last_name: editLast.trim() || null,
        phone_number: editPhone.trim(),
        email: editEmail.trim() || undefined,
        date_of_birth: editDob.trim() || null,
        emergency_contact_name: editEmergencyName.trim() || null,
        emergency_contact_phone: editEmergencyPhone.trim() || null,
        address: editAddress.trim() || null,
      });
      setMe(updated);
      setEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update profile', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setEditSaving(false);
    }
  }, [
    me,
    editFirst,
    editLast,
    editPhone,
    editEmail,
    editDob,
    editEmergencyName,
    editEmergencyPhone,
    editAddress,
    setMe,
  ]);

  const handleChangePhoto = useCallback(async () => {
    if (!me?.id) return;
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to change your profile photo.',
          [{ text: 'OK' }]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const uri = asset.uri;
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      const formData = new FormData();
      formData.append('photo', {
        uri: Platform.OS === 'web' ? uri : uri,
        type,
        name: filename,
      } as unknown as Blob);
      setUploadingPhoto(true);
      const updatedUser = await usersService.updatePhoto(me.id, formData);
      setMe(updatedUser);
      showToast.success('Profile photo updated successfully.');
    } catch (error) {
      console.error('Failed to upload photo', error);
      Alert.alert('Error', 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [me?.id, setMe]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const fullName = me ? [me.first_name, me.last_name].filter(Boolean).join(' ') : '';
  const emergencyValues = [me?.emergency_contact_name, me?.emergency_contact_phone].filter(Boolean) as string[];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: background }]}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>My Account</Text>
      <Text style={styles.subtitle}>Manage your profile and preferences</Text>

      {/* Profile photo */}
      <View style={styles.card}>
        <View style={styles.photoRow}>
          <View style={styles.avatarWrap}>
            {me?.photo_url ? (
              <Image source={{ uri: getMediaUrl(me.photo_url) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {me?.first_name?.[0] ?? '?'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.photoActions}>
            <Pressable
              style={[styles.outlineBtn, uploadingPhoto && styles.outlineBtnDisabled]}
              onPress={handleChangePhoto}
              disabled={uploadingPhoto}
            >
              <Text style={styles.outlineBtnText}>
                {uploadingPhoto ? 'Uploading...' : me?.photo_url ? 'Change Photo' : 'Upload Photo'}
              </Text>
            </Pressable>
            <Text style={styles.photoHint}>JPG, PNG or WebP. Max 5MB.</Text>
          </View>
        </View>
      </View>

      {/* Personal information */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Pressable onPress={() => setEditModalOpen(true)}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
        <InfoRow label="Full Name" value={fullName} />
        <InfoRow label="Phone Number" value={me?.phone_number ?? ''} />
        <InfoRow label="Email Address" value={me?.email ?? ''} optional />
        <InfoRow label="Date of Birth" value={formatDate(me?.date_of_birth)} />
        <InfoRow label="Emergency Contact" value={emergencyValues.join(' · ')} />
        <InfoRow label="Home Address" value={me?.address ?? ''} last />
      </View>

      {/* Notification preferences */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.sectionDesc}>Manage your notification preferences</Text>
        {loadingPrefs ? (
          <ActivityIndicator size="small" color={foreground} style={styles.prefLoader} />
        ) : preferences ? (
          <>
            <ToggleRow
              label="Job Updates"
              value={preferences.job_updates}
              onValueChange={(v) => handlePrefToggle('job_updates', v)}
            />
            <ToggleRow
              label="Company Announcements"
              value={preferences.company_announcements}
              onValueChange={(v) => handlePrefToggle('company_announcements', v)}
            />
            <ToggleRow
              label="Weekend Overtime Alerts"
              value={preferences.weekend_overtime_alerts}
              onValueChange={(v) => handlePrefToggle('weekend_overtime_alerts', v)}
            />
            <ToggleRow
              label="Job Reminders"
              value={preferences.job_reminders}
              onValueChange={(v) => handlePrefToggle('job_reminders', v)}
            />
            <ToggleRow
              label="Expense Updates"
              value={preferences.expense_updates}
              onValueChange={(v) => handlePrefToggle('expense_updates', v)}
            />
            <ToggleRow
              label="Spiff Notifications"
              value={preferences.spiff_notifications}
              onValueChange={(v) => handlePrefToggle('spiff_notifications', v)}
            />
            <View style={styles.deliveryMethodRow}>
              <Text style={styles.toggleLabel}>Delivery Method</Text>
              <View style={styles.deliveryMethodOptions}>
                {(['in_app', 'in_app_email', 'in_app_email_sms'] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    style={[
                      styles.deliveryOption,
                      preferences.delivery_method === opt && styles.deliveryOptionActive,
                    ]}
                    onPress={() => handleDeliveryMethodChange(opt)}
                  >
                    <Text
                      style={[
                        styles.deliveryOptionText,
                        preferences.delivery_method === opt && styles.deliveryOptionTextActive,
                      ]}
                    >
                      {opt === 'in_app' ? 'In App' : opt === 'in_app_email' ? 'In App + Email' : 'In App + Email + SMS'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Pressable
              style={[styles.savePrefsBtn, savingPrefs && styles.savePrefsBtnDisabled]}
              onPress={handleSavePreferences}
              disabled={savingPrefs}
            >
              <Text style={styles.savePrefsBtnText}>
                {savingPrefs ? 'Saving...' : 'Save preferences'}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {/* Security */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Security</Text>
        <Text style={styles.sectionDesc}>Manage your password and security settings</Text>
        <Pressable style={styles.outlineBtn} onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.outlineBtnText}>Change Password</Text>
        </Pressable>
      </View>

      {/* Sign out */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout} accessibilityLabel="Log out" accessibilityRole="button">
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </Pressable>

      {/* Edit Personal Info Modal */}
      <Modal visible={editModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Personal Information</Text>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
              <Text style={styles.label}>First name</Text>
              <TextInput
                style={styles.input}
                value={editFirst}
                onChangeText={setEditFirst}
                placeholder="First name"
              />
              <Text style={styles.label}>Last name</Text>
              <TextInput
                style={styles.input}
                value={editLast}
                onChangeText={setEditLast}
                placeholder="Last name"
              />
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Date of birth</Text>
              <Pressable
                style={styles.dateBtn}
                onPress={() => setShowDobPicker(true)}
              >
                <Text style={[styles.dateBtnText, !editDob && styles.dateBtnPlaceholder]}>
                  {editDob ? formatDate(editDob) : 'Select date'}
                </Text>
              </Pressable>
              {showDobPicker && (
                <DateTimePicker
                  value={editDob ? new Date(editDob + 'T12:00:00') : new Date('2000-01-01')}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={(_, selectedDate) => {
                    setShowDobPicker(Platform.OS === 'ios');
                    if (selectedDate) setEditDob(selectedDate.toISOString().slice(0, 10));
                  }}
                />
              )}
              <Text style={styles.label}>Emergency contact name</Text>
              <TextInput
                style={styles.input}
                value={editEmergencyName}
                onChangeText={setEditEmergencyName}
                placeholder="Name"
              />
              <Text style={styles.label}>Emergency contact phone</Text>
              <TextInput
                style={styles.input}
                value={editEmergencyPhone}
                onChangeText={setEditEmergencyPhone}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
              <Text style={styles.label}>Home address</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Address"
                multiline
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.submitBtn, editSaving && styles.submitBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={editSaving}
              >
                <Text style={styles.submitBtnText}>{editSaving ? 'Saving...' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  optional,
  last,
}: {
  label: string;
  value: string;
  optional?: boolean;
  last?: boolean;
}) {
  if (optional && !value) return null;
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={3}>{value || '—'}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.base },
  title: { ...typography.sectionTitle, color: foreground, marginBottom: spacing.sm },
  subtitle: { fontSize: 14, color: mutedForeground, marginBottom: spacing.base },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: border,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 28, fontWeight: '600', color: mutedForeground },
  photoActions: { flex: 1 },
  outlineBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
    alignSelf: 'flex-start',
  },
  outlineBtnDisabled: { opacity: 0.6 },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: foreground },
  photoHint: { fontSize: 12, color: mutedForeground, marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { ...typography.title, color: foreground, marginBottom: spacing.sm },
  editLink: { fontSize: 14, fontWeight: '600', color: primary },
  sectionDesc: { fontSize: 13, color: mutedForeground, marginBottom: spacing.md },
  infoRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 12, fontWeight: '500', color: mutedForeground, marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: foreground },
  prefLoader: { marginVertical: spacing.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  toggleLabel: { fontSize: 14, color: foreground, flex: 1 },
  deliveryMethodRow: { paddingVertical: spacing.sm, marginTop: spacing.xs },
  deliveryMethodOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  deliveryOption: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: border,
  },
  deliveryOptionActive: { backgroundColor: primary, borderColor: primary },
  deliveryOptionText: { fontSize: 13, color: foreground },
  deliveryOptionTextActive: { color: primaryForeground, fontWeight: '600' },
  savePrefsBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  savePrefsBtnDisabled: { opacity: 0.6 },
  savePrefsBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  logoutBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: radius.sm,
    backgroundColor: destructiveMuted,
  },
  logoutBtnText: { fontSize: 16, fontWeight: '600', color: destructive },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.lg },
  modalScroll: { maxHeight: 400 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4, color: foreground },
  dateBtn: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base },
  dateBtnText: { fontSize: 16, color: foreground },
  dateBtnPlaceholder: { color: mutedForeground },
  input: { borderWidth: 1, borderColor: border, borderRadius: radius.sm, padding: spacing.md, marginBottom: spacing.base, fontSize: 16 },
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.base },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: border },
  cancelBtnText: { fontSize: 16, fontWeight: '500', color: foreground },
  submitBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radius.sm, backgroundColor: primary },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: primaryForeground },
});

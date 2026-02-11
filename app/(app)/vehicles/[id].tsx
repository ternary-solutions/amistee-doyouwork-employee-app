import { DocumentViewerModal } from "@/components/document/DocumentViewerModal";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import {
    background,
    border,
    card,
    foreground,
    muted,
    mutedForeground,
    primary,
    primaryForeground,
    radius,
    spacing,
    typography,
} from "@/constants/theme";
import { useCloseModalOnDrawerOpen } from "@/contexts/DrawerModalContext";
import { useSetHeaderOptions } from "@/contexts/HeaderOptionsContext";
import { repairRequestsService } from "@/services/requests/repairs";
import { vehiclesService } from "@/services/vehicles";
import type { RepairPriority, RepairRequest } from "@/types/requests/repairs";
import type { Vehicle } from "@/types/vehicles";
import { getMediaSource } from "@/utils/api";
import { getErrorMessage } from "@/utils/errorMessage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PRIORITIES: RepairPriority[] = ["Low", "Medium", "High"];

function getStatusLabel(status: boolean | null | undefined): string {
  if (status === true) return "OK";
  if (status === false) return "Out of Service";
  return "Needs Service";
}

function getStatusStyle(
  status: boolean | null | undefined,
): "ok" | "out" | "needs" {
  if (status === true) return "ok";
  if (status === false) return "out";
  return "needs";
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"requests" | "details">("details");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createDescription, setCreateDescription] = useState("");
  const [createPriority, setCreatePriority] =
    useState<RepairPriority>("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [docViewer, setDocViewer] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [v, r] = await Promise.all([
        vehiclesService.getById(id),
        repairRequestsService.list(1, 20, id),
      ]);
      setVehicle(v);
      setRequests(r?.items ?? []);
    } catch (error) {
      console.error("Failed to load vehicle/requests", error);
      Alert.alert(
        "Error",
        getErrorMessage(error, "Failed to load vehicle. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useSetHeaderOptions(
    useMemo(() => ({ title: "Vehicle", showBack: true }), []),
  );

  useCloseModalOnDrawerOpen(() => setCreateModalOpen(false));

  const handleCreateRequest = async () => {
    const desc = createDescription.trim();
    if (!id || !desc) return;
    try {
      setSubmitting(true);
      await repairRequestsService.create({
        vehicle_id: id,
        description: desc,
        priority: createPriority,
      });
      setCreateModalOpen(false);
      setCreateDescription("");
      setCreatePriority("Medium");
      load();
    } catch (error) {
      console.error("Create repair request failed", error);
      Alert.alert("Error", getErrorMessage(error, "Failed to submit request."));
    } finally {
      setSubmitting(false);
    }
  };

  const openDocument = useCallback(
    (url: string | null | undefined, docTitle: string) => {
      if (!url?.trim()) return;
      setDocViewer({ url, title: docTitle });
    },
    [],
  );

  if (loading || !vehicle) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  const statusStyle = getStatusStyle(vehicle.status);

  return (
    <ScrollView
      style={{ backgroundColor: background }}
      contentContainerStyle={[
        styles.container,
        { paddingBottom: spacing.xl + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Vehicle header with photo */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>{vehicle.vehicle_name}</Text>
        <View style={styles.photoWrap}>
          {vehicle.photo_url ? (
            <Image
              source={getMediaSource(vehicle.photo_url)}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="car" size={40} color={mutedForeground} />
            </View>
          )}
        </View>
      </View>

      {/* New Request CTA */}
      <Pressable
        style={({ pressed }) => [
          styles.newRequestBtn,
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => setCreateModalOpen(true)}
        accessibilityLabel="New maintenance request"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={22} color={primaryForeground} />
        <Text style={styles.newRequestBtnText}>New Request</Text>
      </Pressable>

      {/* Tabs - Details first */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === "details" && styles.tabActive]}
          onPress={() => setTab("details")}
        >
          <Text
            style={[styles.tabText, tab === "details" && styles.tabTextActive]}
          >
            Details
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "requests" && styles.tabActive]}
          onPress={() => setTab("requests")}
        >
          <Text
            style={[styles.tabText, tab === "requests" && styles.tabTextActive]}
          >
            Requests
          </Text>
        </Pressable>
      </View>

      {tab === "details" ? (
        <View style={styles.detailsCard}>
          <DetailRow label="License Plate" value={vehicle.license_plate} />
          <DetailRow label="VIN" value={vehicle.vin} />
          <DetailRow
            label="Vehicle Type"
            value={vehicle.vehicle_type?.name ?? "—"}
          />
          {vehicle.vehicle_type?.description ? (
            <DetailRow
              label="Type Description"
              value={vehicle.vehicle_type.description}
            />
          ) : null}
          <DetailRow
            label="Status"
            value={
              vehicle.status !== undefined && vehicle.status !== null ? (
                <View
                  style={[
                    styles.statusBadge,
                    statusStyle === "ok"
                      ? styles.statusOk
                      : statusStyle === "out"
                        ? styles.statusOut
                        : styles.statusNeeds,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>
                    {getStatusLabel(vehicle.status)}
                  </Text>
                </View>
              ) : (
                "—"
              )
            }
          />
          {(vehicle.make || vehicle.model || vehicle.year) && (
            <DetailRow
              label="Make / Model / Year"
              value={
                [vehicle.make, vehicle.model, vehicle.year]
                  .filter(Boolean)
                  .join(" ") || "—"
              }
            />
          )}
          {vehicle.location?.name && (
            <DetailRow label="Location" value={vehicle.location.name} />
          )}
          <DetailRow
            label="Added"
            value={
              vehicle.created_at
                ? new Date(vehicle.created_at).toLocaleDateString()
                : "—"
            }
          />
          <View style={styles.docSection}>
            <Text style={styles.docLabel}>Documents</Text>
            {vehicle.insurance_doc ? (
              <Pressable
                style={({ pressed }) => [
                  styles.docBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() =>
                  openDocument(vehicle.insurance_doc, "Insurance Document")
                }
              >
                <Ionicons name="document-text" size={18} color={primary} />
                <Text style={styles.docBtnText}>View Insurance Document</Text>
              </Pressable>
            ) : null}
            {vehicle.registration_doc ? (
              <Pressable
                style={({ pressed }) => [
                  styles.docBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() =>
                  openDocument(
                    vehicle.registration_doc,
                    "Registration Document",
                  )
                }
              >
                <Ionicons name="document-text" size={18} color={primary} />
                <Text style={styles.docBtnText}>
                  View Registration Document
                </Text>
              </Pressable>
            ) : null}
            {!vehicle.insurance_doc && !vehicle.registration_doc && (
              <Text style={styles.noDocs}>No documents</Text>
            )}
          </View>
        </View>
      ) : tab === "requests" ? (
        requests.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No maintenance requests yet.</Text>
            <Text style={styles.emptyHint}>
              Tap the + button to create one.
            </Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {requests.map((r) => (
              <AnimatedPressable
                key={r.id}
                style={styles.card}
                onPress={() =>
                  router.push(`/(app)/vehicles/${id}/requests/${r.id}`)
                }
                accessibilityLabel={`${r.description}, ${r.status}, view details`}
                accessibilityRole="button"
              >
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {r.description}
                </Text>
                <Text style={styles.meta}>
                  {new Date(r.request_date).toLocaleDateString()} · {r.status} ·{" "}
                  {r.priority}
                </Text>
              </AnimatedPressable>
            ))}
          </View>
        )
      ) : null}

      <DocumentViewerModal
        visible={!!docViewer}
        onClose={() => setDocViewer(null)}
        url={docViewer?.url ?? null}
        title={docViewer?.title ?? ""}
      />

      <Modal visible={createModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>New maintenance request</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={createDescription}
                onChangeText={setCreateDescription}
                placeholder="Describe the issue..."
                placeholderTextColor={mutedForeground}
                multiline
              />
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => (
                  <Pressable
                    key={p}
                    style={[
                      styles.priorityBtn,
                      createPriority === p && styles.priorityBtnActive,
                    ]}
                    onPress={() => setCreatePriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        createPriority === p && styles.priorityBtnTextActive,
                      ]}
                    >
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => setCreateModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  (!createDescription.trim() || submitting) &&
                    styles.submitBtnDisabled,
                  pressed &&
                    createDescription.trim() &&
                    !submitting && { opacity: 0.8 },
                ]}
                onPress={handleCreateRequest}
                disabled={!createDescription.trim() || submitting}
              >
                <Text style={styles.submitBtnText}>
                  {submitting ? "Submitting..." : "Submit"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {typeof value === "string" ? (
        <Text style={styles.detailValue}>{value || "—"}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: spacing.base },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerSection: { alignItems: "center", marginBottom: spacing.base },
  headerTitle: {
    ...typography.sectionTitle,
    fontSize: 22,
    color: foreground,
    marginBottom: spacing.md,
  },
  photoWrap: { marginBottom: spacing.sm },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: card,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: muted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: card,
  },
  newRequestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: primary,
    marginBottom: spacing.lg,
  },
  newRequestBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: primaryForeground,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: muted,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "500", color: mutedForeground },
  tabTextActive: { color: foreground, fontWeight: "600" },
  emptyCard: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: border,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: mutedForeground },
  emptyHint: { fontSize: 13, color: mutedForeground, marginTop: 4 },
  requestsList: { gap: spacing.md },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  cardTitle: { ...typography.title, color: foreground, marginBottom: 4 },
  meta: { fontSize: 13, color: mutedForeground },
  detailsCard: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
  },
  detailRow: { marginBottom: spacing.base },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: mutedForeground,
    marginBottom: 4,
  },
  detailValue: { fontSize: 15, color: foreground },
  docSection: { marginTop: spacing.sm },
  docLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: mutedForeground,
    marginBottom: 8,
  },
  docBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.base,
    borderRadius: radius.base,
    borderWidth: 1,
    borderColor: border,
    marginBottom: 8,
  },
  docBtnText: { fontSize: 14, fontWeight: "500", color: primary },
  noDocs: { fontSize: 13, color: mutedForeground },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusOk: { backgroundColor: "rgba(34, 197, 94, 0.2)" },
  statusOut: { backgroundColor: "rgba(245, 158, 11, 0.2)" },
  statusNeeds: { backgroundColor: "rgba(244, 63, 94, 0.2)" },
  statusBadgeText: { fontSize: 12, fontWeight: "600", color: foreground },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  modalTitle: { ...typography.sectionTitle, marginBottom: spacing.base },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: foreground,
  },
  input: {
    borderWidth: 1,
    borderColor: border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  priorityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  priorityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: muted,
  },
  priorityBtnActive: { backgroundColor: primary },
  priorityBtnText: { fontSize: 14, fontWeight: "500", color: foreground },
  priorityBtnTextActive: { color: primaryForeground },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.base,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: border,
  },
  cancelBtnText: { fontSize: 16, fontWeight: "500", color: foreground },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.sm,
    backgroundColor: primary,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: primaryForeground, fontSize: 16, fontWeight: "600" },
});

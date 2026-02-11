import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function VehicleRequestDetailScreen() {
  const { id, requestId } = useLocalSearchParams<{ id: string; requestId: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Request</Text>
      <Text style={styles.subtitle}>Vehicle: {id} · Request: {requestId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b' },
});

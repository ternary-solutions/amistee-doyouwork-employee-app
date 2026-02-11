import { card, primary } from '@/constants/theme';
import { useMainStore } from '@/store/main';
import { tokenStorage } from '@/utils/tokenStorage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const me = useMainStore((state) => state.me);

  useEffect(() => {
    tokenStorage.getAccessToken().then((token) => {
      setHasToken(!!token);
    });
  }, []);

  if (hasToken === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={primary} />
      </View>
    );
  }

  if (!hasToken) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(app)/dashboard" />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: card,
  },
});

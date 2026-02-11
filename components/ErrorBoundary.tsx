import { background, card, foreground, mutedForeground, primary, primaryForeground, radius, spacing } from '@/constants/theme';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but an unexpected error occurred. Please try again or contact support if the issue persists.
            </Text>
            {this.state.error && (
              <View style={styles.details}>
                <Text style={styles.detailsText} numberOfLines={5}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={this.handleRetry}
            >
              <Text style={styles.buttonText}>Try again</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
  },
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: foreground,
    marginBottom: spacing.base,
  },
  message: {
    fontSize: 16,
    color: mutedForeground,
    marginBottom: spacing.base,
    lineHeight: 24,
  },
  details: {
    backgroundColor: '#e2e8f0',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.base,
  },
  detailsText: {
    fontSize: 12,
    color: mutedForeground,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: primary,
    borderRadius: radius.base,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: primaryForeground,
  },
});

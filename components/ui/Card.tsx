import {
  card,
  cardForeground,
  radius,
  spacing,
  border,
} from '@/constants/theme';
import { StyleSheet, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: card,
    borderRadius: radius.base,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});

export const cardStyles = {
  card,
  cardForeground,
  radius,
  spacing,
  border,
};

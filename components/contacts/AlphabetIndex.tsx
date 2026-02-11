import { mutedForeground } from '@/constants/theme';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface AlphabetIndexProps {
  letters: string[];
  onJump: (letter: string) => void;
}

/**
 * Fixed right-side alphabet index for quick jump to contact sections.
 */
export function AlphabetIndex({ letters, onJump }: AlphabetIndexProps) {
  if (letters.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.letters}>
        {letters.map((letter) => (
          <Pressable
            key={letter}
            style={({ pressed }) => [styles.letter, pressed && styles.letterPressed]}
            onPress={() => onJump(letter)}
            accessibilityLabel={`Jump to ${letter}`}
            accessibilityRole="button"
          >
            <Text style={styles.letterText}>{letter}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingRight: 4,
    zIndex: 10,
  },
  letters: {
    alignItems: 'center',
    gap: 2,
  },
  letter: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  letterPressed: {
    opacity: 0.7,
  },
  letterText: {
    fontSize: 11,
    fontWeight: '600',
    color: mutedForeground,
  },
});

import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTodoCounts } from '@/hooks/useFilteredTodos';

export function Header() {
  const { active } = useTodoCounts();
  return (
    <View style={styles.container} testID="todo-header">
      <Text style={styles.title}>Todos</Text>
      <Text style={styles.subtitle} testID="todo-header-count">
        {active === 0 ? 'All clear' : `${active} ${active === 1 ? 'item' : 'items'} left`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
}));

import { Pressable, Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTodoCounts } from '@/hooks/useFilteredTodos';
import { useTodoStore } from '@/store/todoStore';
import type { TodoFilter } from '@/types/todo';

const FILTERS: ReadonlyArray<{ key: TodoFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export function FilterTabs() {
  const filter = useTodoStore((s) => s.filter);
  const setFilter = useTodoStore((s) => s.setFilter);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);
  const { completed } = useTodoCounts();

  return (
    <View style={styles.container} testID="filter-tabs">
      <View style={styles.tabs}>
        {FILTERS.map(({ key, label }) => {
          const isActive = filter === key;
          return (
            <Pressable
              key={key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setFilter(key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Show ${label.toLowerCase()} todos`}
              testID={`filter-${key}`}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        style={[styles.clearButton, completed === 0 && styles.clearButtonDisabled]}
        onPress={clearCompleted}
        disabled={completed === 0}
        accessibilityRole="button"
        accessibilityLabel="Clear completed todos"
        testID="clear-completed"
      >
        <Text style={[styles.clearText, completed === 0 && styles.clearTextDisabled]}>
          Clear completed
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  tab: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
  },
  tabActive: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  tabText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.textPrimary,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  clearButtonDisabled: {
    opacity: 0.4,
  },
  clearText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
  },
  clearTextDisabled: {
    color: theme.colors.textSecondary,
  },
}));

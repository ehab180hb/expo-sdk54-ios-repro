import { Text, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTodoStore } from '@/store/todoStore';

const COPY = {
  all: { title: 'No todos yet', body: 'Add your first one above to get started.' },
  active: { title: 'Nothing to do', body: 'All your todos are checked off.' },
  completed: { title: 'No completed todos', body: 'Check one off to see it here.' },
} as const;

export function EmptyState() {
  const filter = useTodoStore((s) => s.filter);
  const { title, body } = COPY[filter];
  return (
    <View style={styles.container} testID="empty-state">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
}));

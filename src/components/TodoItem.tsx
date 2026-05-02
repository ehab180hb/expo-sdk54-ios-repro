import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Swipeable } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native-unistyles';

import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/todo';

interface Props {
  todo: Todo;
}

export function TodoItem({ todo }: Props) {
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const removeTodo = useTodoStore((s) => s.removeTodo);

  const handleToggle = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleTodo(todo.id);
  }, [toggleTodo, todo.id]);

  const handleDelete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeTodo(todo.id);
  }, [removeTodo, todo.id]);

  const renderRightActions = () => (
    <Pressable
      style={styles.deleteAction}
      onPress={handleDelete}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${todo.text}`}
      testID={`todo-delete-${todo.id}`}
    >
      <Text style={styles.deleteActionText}>Delete</Text>
    </Pressable>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
    >
      <Pressable
        style={styles.container}
        onPress={handleToggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: todo.completed }}
        accessibilityLabel={todo.text}
        testID={`todo-item-${todo.id}`}
      >
        <View
          style={[styles.checkbox, todo.completed && styles.checkboxChecked]}
          testID={`todo-checkbox-${todo.id}`}
        >
          {todo.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text
          style={[styles.text, todo.completed && styles.textCompleted]}
          numberOfLines={2}
          testID={`todo-text-${todo.id}`}
        >
          {todo.text}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  checkmark: {
    color: theme.colors.textOnAccent,
    fontSize: 14,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  textCompleted: {
    color: theme.colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  deleteAction: {
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteActionText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textOnAccent,
  },
}));

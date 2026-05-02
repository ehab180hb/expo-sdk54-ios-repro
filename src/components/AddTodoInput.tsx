import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useTodoStore } from '@/store/todoStore';

export function AddTodoInput() {
  const [text, setText] = useState('');
  const addTodo = useTodoStore((s) => s.addTodo);

  const trimmed = text.trim();
  const canSubmit = trimmed.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    addTodo(trimmed);
    setText('');
  };

  return (
    <View style={styles.container} testID="add-todo-row">
      <TextInput
        style={styles.input}
        placeholder="What needs doing?"
        placeholderTextColor={styles.placeholder.color}
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        returnKeyType="done"
        autoCorrect
        autoCapitalize="sentences"
        accessibilityLabel="New todo"
        testID="add-todo-input"
      />
      <Pressable
        style={[styles.button, !canSubmit && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityLabel="Add todo"
        testID="add-todo-submit"
      >
        <Text style={styles.buttonText}>Add</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    ...theme.typography.body,
  },
  placeholder: {
    color: theme.colors.textSecondary,
  },
  button: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    borderRadius: theme.radii.md,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.accentMuted,
  },
  buttonText: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textOnAccent,
  },
}));

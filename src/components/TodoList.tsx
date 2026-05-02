import { FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { useFilteredTodos } from '@/hooks/useFilteredTodos';
import type { Todo } from '@/types/todo';

import { EmptyState } from './EmptyState';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const todos = useFilteredTodos();

  if (todos.length === 0) {
    return <EmptyState />;
  }

  return (
    <FlatList
      style={styles.list}
      data={todos}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // Disable bouncing-on-empty so the user perceives the empty state
      // as a deliberate UI surface, not a glitch.
      bounces={todos.length > 0}
      testID="todo-list"
    />
  );
}

const keyExtractor = (item: Todo) => item.id;
const renderItem = ({ item }: { item: Todo }) => <TodoItem todo={item} />;

const styles = StyleSheet.create((theme) => ({
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
}));

import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';

import { AddTodoInput, FilterTabs, Header, TodoList } from '@/components';
import { useHasHydrated } from '@/store/todoStore';

export function HomeScreen() {
  const hasHydrated = useHasHydrated();
  const insets = useSafeAreaInsets();

  if (!hasHydrated) {
    return (
      <View style={styles.loading} testID="hydrating">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <Header />
        <AddTodoInput />
        <View style={styles.listContainer}>
          <TodoList />
        </View>
        <View style={{ paddingBottom: insets.bottom > 0 ? 0 : 8 }}>
          <FilterTabs />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    flex: 1,
  },
}));

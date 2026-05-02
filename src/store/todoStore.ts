/**
 * Todo store — single source of truth for todo state and the only place
 * that mutates it. Components dispatch actions by calling these
 * functions; they never reach into AsyncStorage directly.
 *
 * Persistence is done via zustand's `persist` middleware, which
 * serializes the store to AsyncStorage on every change and rehydrates
 * on app boot. Hydration is asynchronous — see `useHasHydrated` for
 * gating the splash → home transition.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { Todo, TodoFilter } from '@/types/todo';
import { generateId } from '@/utils/id';

import { asyncStorageAdapter, STORAGE_KEY } from './persistence';

interface TodoState {
  todos: Todo[];
  filter: TodoFilter;

  // Actions — keep names verb-first and unambiguous.
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  editTodo: (id: string, text: string) => void;
  clearCompleted: () => void;
  setFilter: (filter: TodoFilter) => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      filter: 'all',

      addTodo: (text) => {
        const trimmed = text.trim();
        if (!trimmed) return; // silently ignore empty — UI also blocks submit
        const todo: Todo = {
          id: generateId(),
          text: trimmed,
          completed: false,
          createdAt: Date.now(),
        };
        // Newest at top so the list reads chronologically descending.
        set((state) => ({ todos: [todo, ...state.todos] }));
      },

      toggleTodo: (id) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
        })),

      removeTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        })),

      editTodo: (id, text) => {
        const trimmed = text.trim();
        if (!trimmed) return; // edit-to-empty is a no-op; deletion uses removeTodo
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, text: trimmed } : t)),
        }));
      },

      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((t) => !t.completed),
        })),

      setFilter: (filter) => set({ filter }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => asyncStorageAdapter),
      version: 1,
      // Only persist data, not action methods (zustand handles this for us
      // via partialize when needed).
      partialize: (state) => ({ todos: state.todos, filter: state.filter }),
    },
  ),
);

/**
 * `true` once the persisted state has been read from AsyncStorage and
 * merged into the in-memory store. Components can use this to defer
 * rendering until after hydration to avoid the "empty list flicker"
 * on cold launches with previously-saved todos.
 */
export const useHasHydrated = () => {
  // Direct access to the rehydration flag the persist middleware exposes.
  // (Internal API; if zustand renames it, update here.)
  return useTodoStore.persist.hasHydrated();
};

/**
 * Domain types for the todo app.
 *
 * Kept deliberately small — the entire domain fits in two types because
 * the app has no backend. If/when an API is added, persistence-shape
 * (what AsyncStorage stores) and wire-shape (what the API returns)
 * should split into separate types here.
 */

export interface Todo {
  /** Stable unique id, generated client-side via uuid v4. */
  id: string;
  /** Body text, never empty (validated at create time). */
  text: string;
  /** Whether the todo is checked off. */
  completed: boolean;
  /** Unix epoch ms; set on create, immutable. */
  createdAt: number;
}

export type TodoFilter = 'all' | 'active' | 'completed';

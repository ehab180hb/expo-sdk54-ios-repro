import { fireEvent, render, screen } from '@testing-library/react-native';

import { AddTodoInput } from '@/components/AddTodoInput';
import { useTodoStore } from '@/store/todoStore';

beforeEach(() => {
  useTodoStore.setState({ todos: [], filter: 'all' });
});

describe('<AddTodoInput />', () => {
  it('disables the submit button when input is empty', () => {
    render(<AddTodoInput />);
    expect(screen.getByTestId('add-todo-submit')).toBeDisabled();
  });

  it('enables the submit button once non-whitespace text is entered', () => {
    render(<AddTodoInput />);
    fireEvent.changeText(screen.getByTestId('add-todo-input'), 'walk dog');
    expect(screen.getByTestId('add-todo-submit')).not.toBeDisabled();
  });

  it('keeps the submit button disabled for whitespace-only input', () => {
    render(<AddTodoInput />);
    fireEvent.changeText(screen.getByTestId('add-todo-input'), '   ');
    expect(screen.getByTestId('add-todo-submit')).toBeDisabled();
  });

  it('adds a todo on submit and clears the input', () => {
    render(<AddTodoInput />);
    const input = screen.getByTestId('add-todo-input');

    fireEvent.changeText(input, 'walk dog');
    fireEvent.press(screen.getByTestId('add-todo-submit'));

    expect(useTodoStore.getState().todos.map((t) => t.text)).toEqual(['walk dog']);
    expect(input.props.value).toBe('');
  });

  it('also adds via onSubmitEditing (return key)', () => {
    render(<AddTodoInput />);
    const input = screen.getByTestId('add-todo-input');
    fireEvent.changeText(input, 'feed cat');
    fireEvent(input, 'submitEditing');
    expect(useTodoStore.getState().todos[0]?.text).toBe('feed cat');
  });
});

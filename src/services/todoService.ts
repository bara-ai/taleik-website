import { Todo, CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

class TodoService {
  private todos: Map<string, Todo> = new Map();
  private nextId = 1;

  private generateId(): string {
    return (this.nextId++).toString();
  }

  getAllTodos(): Todo[] {
    return Array.from(this.todos.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getTodoById(id: string): Todo | undefined {
    return this.todos.get(id);
  }

  createTodo(request: CreateTodoRequest): Todo {
    const now = new Date();
    const todo: Todo = {
      id: this.generateId(),
      title: request.title,
      description: request.description,
      completed: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.todos.set(todo.id, todo);
    return todo;
  }

  updateTodo(id: string, request: UpdateTodoRequest): Todo | undefined {
    const todo = this.todos.get(id);
    if (!todo) {
      return undefined;
    }

    const updatedTodo: Todo = {
      ...todo,
      title: request.title !== undefined ? request.title : todo.title,
      description: request.description !== undefined ? request.description : todo.description,
      completed: request.completed !== undefined ? request.completed : todo.completed,
      updatedAt: new Date()
    };

    this.todos.set(id, updatedTodo);
    return updatedTodo;
  }

  deleteTodo(id: string): boolean {
    return this.todos.delete(id);
  }

  // For testing purposes
  clear(): void {
    this.todos.clear();
    this.nextId = 1;
  }
}

export const todoService = new TodoService();
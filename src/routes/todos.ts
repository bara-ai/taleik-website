import { Router, Request, Response } from 'express';
import { todoService } from '../services/todoService';
import { CreateTodoRequest, UpdateTodoRequest } from '../types/todo';

const router = Router();

// GET /todos - Get all todos
router.get('/', (_req: Request, res: Response) => {
  try {
    const todos = todoService.getAllTodos();
    res.json({ success: true, data: todos });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch todos' });
  }
});

// GET /todos/:id - Get a specific todo
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const todo = todoService.getTodoById(id);
    
    if (!todo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    
    res.json({ success: true, data: todo });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch todo' });
  }
});

// POST /todos - Create a new todo
router.post('/', (req: Request, res: Response) => {
  try {
    const { title, description } = req.body as CreateTodoRequest;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const todo = todoService.createTodo({ title: title.trim(), description });
    res.status(201).json({ success: true, data: todo });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to create todo' });
  }
});

// PUT /todos/:id - Update a todo
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body as UpdateTodoRequest;
    
    if (updateData.title !== undefined && updateData.title.trim() === '') {
      return res.status(400).json({ success: false, error: 'Title cannot be empty' });
    }
    
    const updatedTodo = todoService.updateTodo(id, {
      ...updateData,
      title: updateData.title?.trim()
    });
    
    if (!updatedTodo) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    
    res.json({ success: true, data: updatedTodo });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update todo' });
  }
});

// DELETE /todos/:id - Delete a todo
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = todoService.deleteTodo(id);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Todo not found' });
    }
    
    res.json({ success: true, message: 'Todo deleted successfully' });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to delete todo' });
  }
});

export default router;
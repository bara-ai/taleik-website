import request from 'supertest';
import app from '../index';
import { todoService } from '../services/todoService';

describe('Todo API', () => {
  beforeEach(() => {
    // Clear todos before each test
    todoService.clear();
  });

  describe('GET /todos', () => {
    it('returns empty array when no todos exist', async () => {
      const res = await request(app).get('/todos');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, data: [] });
    });

    it('returns all todos sorted by creation date (newest first)', async () => {
      // Create multiple todos
      await request(app).post('/todos').send({ title: 'First todo' });
      await request(app).post('/todos').send({ title: 'Second todo' });
      
      const res = await request(app).get('/todos');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe('Second todo'); // Newest first
      expect(res.body.data[1].title).toBe('First todo');
    });
  });

  describe('POST /todos', () => {
    it('creates a new todo with title only', async () => {
      const todoData = { title: 'Test todo' };
      const res = await request(app).post('/todos').send(todoData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        title: 'Test todo',
        completed: false,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('creates a new todo with title and description', async () => {
      const todoData = { title: 'Test todo', description: 'Test description' };
      const res = await request(app).post('/todos').send(todoData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Test todo');
      expect(res.body.data.description).toBe('Test description');
    });

    it('trims whitespace from title', async () => {
      const todoData = { title: '  Test todo  ' };
      const res = await request(app).post('/todos').send(todoData);
      
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Test todo');
    });

    it('returns 400 when title is missing', async () => {
      const res = await request(app).post('/todos').send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, error: 'Title is required' });
    });

    it('returns 400 when title is empty or only whitespace', async () => {
      const res = await request(app).post('/todos').send({ title: '   ' });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, error: 'Title is required' });
    });
  });

  describe('GET /todos/:id', () => {
    it('returns a specific todo by id', async () => {
      const createRes = await request(app).post('/todos').send({ title: 'Test todo' });
      const todoId = createRes.body.data.id;
      
      const res = await request(app).get(`/todos/${todoId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(todoId);
      expect(res.body.data.title).toBe('Test todo');
    });

    it('returns 404 when todo not found', async () => {
      const res = await request(app).get('/todos/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Todo not found' });
    });
  });

  describe('PUT /todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const createRes = await request(app).post('/todos').send({ 
        title: 'Original title',
        description: 'Original description'
      });
      todoId = createRes.body.data.id;
    });

    it('updates todo title', async () => {
      const res = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: 'Updated title' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated title');
      expect(res.body.data.description).toBe('Original description');
    });

    it('updates todo completion status', async () => {
      const res = await request(app)
        .put(`/todos/${todoId}`)
        .send({ completed: true });
      
      expect(res.status).toBe(200);
      expect(res.body.data.completed).toBe(true);
    });

    it('updates multiple fields at once', async () => {
      const res = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: 'New title', description: 'New description', completed: true });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('New title');
      expect(res.body.data.description).toBe('New description');
      expect(res.body.data.completed).toBe(true);
    });

    it('trims whitespace from updated title', async () => {
      const res = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: '  Updated title  ' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated title');
    });

    it('returns 400 when title is empty', async () => {
      const res = await request(app)
        .put(`/todos/${todoId}`)
        .send({ title: '   ' });
      
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, error: 'Title cannot be empty' });
    });

    it('returns 404 when todo not found', async () => {
      const res = await request(app)
        .put('/todos/999')
        .send({ title: 'Updated title' });
      
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Todo not found' });
    });
  });

  describe('DELETE /todos/:id', () => {
    let todoId: string;

    beforeEach(async () => {
      const createRes = await request(app).post('/todos').send({ title: 'Test todo' });
      todoId = createRes.body.data.id;
    });

    it('deletes a todo', async () => {
      const res = await request(app).delete(`/todos/${todoId}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, message: 'Todo deleted successfully' });
      
      // Verify todo is actually deleted
      const getRes = await request(app).get(`/todos/${todoId}`);
      expect(getRes.status).toBe(404);
    });

    it('returns 404 when todo not found', async () => {
      const res = await request(app).delete('/todos/999');
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, error: 'Todo not found' });
    });
  });
});
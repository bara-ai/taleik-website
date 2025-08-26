import request from 'supertest';
import app from './index';

describe('GET /', () => {
  it('responds with a success message and API info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Taleik API');
    expect(res.body.data.version).toBe('1.0.0');
    expect(res.body.message).toBe('API is running successfully');
  });
});

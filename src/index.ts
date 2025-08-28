import express from 'express';
import todoRoutes from './routes/todos';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.get('/', (_req, res) => {
  res.json({ message: 'Taleik API' });
});

app.use('/todos', todoRoutes);

export default app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

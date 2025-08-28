# Todo API Documentation

This API provides CRUD operations for managing todos.

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Get All Todos
- **GET** `/todos`
- **Description**: Retrieve all todos sorted by creation date (newest first)
- **Response**: 
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Example Todo",
      "description": "Optional description",
      "completed": false,
      "createdAt": "2025-08-28T16:42:27.359Z",
      "updatedAt": "2025-08-28T16:42:27.359Z"
    }
  ]
}
```

### 2. Get Todo by ID
- **GET** `/todos/:id`
- **Description**: Retrieve a specific todo by its ID
- **Response**: 
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Example Todo",
    "description": "Optional description",
    "completed": false,
    "createdAt": "2025-08-28T16:42:27.359Z",
    "updatedAt": "2025-08-28T16:42:27.359Z"
  }
}
```

### 3. Create Todo
- **POST** `/todos`
- **Description**: Create a new todo
- **Request Body**:
```json
{
  "title": "Required title",
  "description": "Optional description"
}
```
- **Response**: Returns the created todo with generated ID and timestamps

### 4. Update Todo
- **PUT** `/todos/:id`
- **Description**: Update an existing todo
- **Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```
- **Response**: Returns the updated todo

### 5. Delete Todo
- **DELETE** `/todos/:id`
- **Description**: Delete a todo by ID
- **Response**: 
```json
{
  "success": true,
  "message": "Todo deleted successfully"
}
```

## Error Responses

All endpoints return error responses in the following format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400 Bad Request`: Invalid input (e.g., missing title)
- `404 Not Found`: Todo not found
- `500 Internal Server Error`: Server error

## Examples

### Creating a todo:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"title":"Learn TypeScript","description":"Master TypeScript fundamentals"}' \
  http://localhost:3000/todos
```

### Updating a todo:
```bash
curl -X PUT -H "Content-Type: application/json" \
  -d '{"completed":true}' \
  http://localhost:3000/todos/1
```

### Getting all todos:
```bash
curl http://localhost:3000/todos
```
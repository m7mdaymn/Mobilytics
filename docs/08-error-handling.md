# Nova Node — Error Handling

## Response Envelope

All API responses follow a consistent envelope format.

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "errors": null
}
```

### Error Response (Controller-level)
```json
{
  "success": false,
  "message": "Description of the error",
  "errors": null
}
```

### Error Response (Middleware-level)
```json
{
  "error": "Description of the error"
}
```

## HTTP Status Codes

### Success Codes

| Code | Usage |
|------|-------|
| 200 OK | Successful GET, PUT, PATCH |
| 201 Created | Successful POST (resource creation) |
| 204 No Content | Successful DELETE |

### Client Error Codes

| Code | Trigger | Example |
|------|---------|---------|
| 400 Bad Request | Validation error, missing tenant slug | Request body fails FluentValidation rules |
| 401 Unauthorized | Missing/invalid/expired JWT, wrong credentials | `UnauthorizedAccessException` |
| 403 Forbidden | Insufficient role, subscription expired/suspended | Accessing platform with tenant token |
| 404 Not Found | Resource not found | `KeyNotFoundException` |
| 409 Conflict | Business rule violation | `InvalidOperationException` |

### Server Error Codes

| Code | Trigger |
|------|---------|
| 500 Internal Server Error | Unhandled exception |

## Exception-to-Status Mapping

The `GlobalExceptionMiddleware` maps exceptions:

```
ValidationException (FluentValidation) → 400
┌─ { errors: [{ propertyName: "Name", errorMessage: "Name is required" }] }

KeyNotFoundException → 404
┌─ { error: "Brand not found." }

UnauthorizedAccessException → 401
┌─ { error: "Invalid credentials." }

InvalidOperationException → 409
┌─ { error: "Cannot delete brand with associated items." }

Exception (catch-all) → 500
┌─ { error: "An unexpected error occurred." }
```

## Validation

Request validation uses **FluentValidation** with automatic DI integration:

```csharp
// Application layer registers all validators
builder.Services.AddApplication(); // calls AddValidatorsFromAssembly
```

Validators are defined in `NovaNode.Application/Validators/` and run automatically before the service layer. Validation failures throw `ValidationException`, which the middleware catches and returns as a 400 response.

### Example Validation Error Response

```json
{
  "errors": [
    { "propertyName": "Name", "errorMessage": "'Name' must not be empty." },
    { "propertyName": "Slug", "errorMessage": "'Slug' must not be empty." }
  ]
}
```

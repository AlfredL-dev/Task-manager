using System.ComponentModel.DataAnnotations;
using backend.Models;

namespace backend.DTOs;

public record CreateTaskRequest(
    [Required, MinLength(1), MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    DateTime? DueDate
);

public record UpdateTaskRequest(
    [Required, MinLength(1), MaxLength(200)] string Title,
    [MaxLength(2000)] string? Description,
    TaskState Status,
    DateTime? DueDate
);

public record TaskResponse(
    int Id,
    string Title,
    string? Description,
    TaskState Status,
    DateTime? DueDate,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

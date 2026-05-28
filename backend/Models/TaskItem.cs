namespace backend.Models;

public enum TaskState
{
    Pending,
    InProgress,
    Done
}

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskState Status { get; set; } = TaskState.Pending;
    public DateTime? DueDate { get; set; }   // stored as UTC
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Ownership — every task belongs to exactly one user
    public int UserId { get; set; }
    public User User { get; set; } = null!;
}

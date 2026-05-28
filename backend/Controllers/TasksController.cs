using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/tasks")]
[Authorize]
public class TasksController(AppDbContext db) : ControllerBase
{
    // Ownership is enforced at the query level throughout — every query
    // includes .Where(t => t.UserId == CurrentUserId).
    // Accessing another user's task returns 404, not 403:
    // we deliberately do not confirm whether a resource exists for a different user.

    private int CurrentUserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/tasks?status=Pending
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> GetAll(
        [FromQuery] TaskState? status)
    {
        var query = db.Tasks.Where(t => t.UserId == CurrentUserId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        var tasks = await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => ToResponse(t))
            .ToListAsync();

        return Ok(tasks);
    }

    // GET /api/tasks/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskResponse>> GetById(int id)
    {
        var task = await FindOwnedOrNull(id);
        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    // POST /api/tasks
    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(CreateTaskRequest req)
    {
        var task = new TaskItem
        {
            Title = req.Title.Trim(),
            Description = req.Description?.Trim(),
            DueDate = req.DueDate.HasValue
                ? DateTime.SpecifyKind(req.DueDate.Value, DateTimeKind.Utc)
                : null,
            UserId = CurrentUserId
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToResponse(task));
    }

    // PUT /api/tasks/{id}
    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskResponse>> Update(int id, UpdateTaskRequest req)
    {
        var task = await FindOwnedOrNull(id);
        if (task is null) return NotFound();

        task.Title = req.Title.Trim();
        task.Description = req.Description?.Trim();
        task.Status = req.Status;
        task.DueDate = req.DueDate.HasValue
            ? DateTime.SpecifyKind(req.DueDate.Value, DateTimeKind.Utc)
            : null;
        task.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(ToResponse(task));
    }

    // DELETE /api/tasks/{id}
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var task = await FindOwnedOrNull(id);
        if (task is null) return NotFound();

        db.Tasks.Remove(task);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // -----------------------------------------------------------------------
    // Ownership helper — returns null instead of throwing when task not found
    // or belongs to a different user.
    private Task<TaskItem?> FindOwnedOrNull(int id) =>
        db.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == CurrentUserId);

    private static TaskResponse ToResponse(TaskItem t) =>
        new(t.Id, t.Title, t.Description, t.Status, t.DueDate, t.CreatedAt, t.UpdatedAt);
}

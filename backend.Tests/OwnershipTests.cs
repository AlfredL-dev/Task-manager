using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace backend.Tests;

/// <summary>
/// Verifies that users can only access their own tasks.
/// This is the highest-risk area: a bug here exposes every user's data.
/// </summary>
public class OwnershipTests : IClassFixture<TestFactory>
{
    private readonly HttpClient _client;

    public OwnershipTests(TestFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task UserA_Cannot_Get_UserB_Task()
    {
        // Arrange — two separate users, each with one task
        var tokenA = await Helpers.RegisterAndGetToken(_client, "a@test.com");
        _client.SetBearer(tokenA);
        var taskIdA = await Helpers.CreateTask(_client, "User A task");

        var tokenB = await Helpers.RegisterAndGetToken(_client, "b@test.com");
        _client.SetBearer(tokenB);

        // Act — User B tries to read User A's task
        var response = await _client.GetAsync($"/api/tasks/{taskIdA}");

        // Assert — 404, not 403: we do not confirm the resource exists
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UserA_Cannot_Update_UserB_Task()
    {
        var tokenA = await Helpers.RegisterAndGetToken(_client, "a2@test.com");
        _client.SetBearer(tokenA);
        var taskIdA = await Helpers.CreateTask(_client, "User A task");

        var tokenB = await Helpers.RegisterAndGetToken(_client, "b2@test.com");
        _client.SetBearer(tokenB);

        var response = await _client.PutAsJsonAsync($"/api/tasks/{taskIdA}",
            new { title = "Hijacked", description = (string?)null,
                  status = 2, dueDate = (DateTime?)null }); // 2 = TaskState.Done

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UserA_Cannot_Delete_UserB_Task()
    {
        var tokenA = await Helpers.RegisterAndGetToken(_client, "a3@test.com");
        _client.SetBearer(tokenA);
        var taskIdA = await Helpers.CreateTask(_client, "User A task");

        var tokenB = await Helpers.RegisterAndGetToken(_client, "b3@test.com");
        _client.SetBearer(tokenB);

        var response = await _client.DeleteAsync($"/api/tasks/{taskIdA}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetAll_Returns_Only_Own_Tasks()
    {
        // User A creates 2 tasks, User B creates 1 task
        var tokenA = await Helpers.RegisterAndGetToken(_client, "a4@test.com");
        _client.SetBearer(tokenA);
        await Helpers.CreateTask(_client, "A task 1");
        await Helpers.CreateTask(_client, "A task 2");

        var tokenB = await Helpers.RegisterAndGetToken(_client, "b4@test.com");
        _client.SetBearer(tokenB);
        await Helpers.CreateTask(_client, "B task 1");

        // User B should only see their 1 task
        var response = await _client.GetAsync("/api/tasks");
        response.EnsureSuccessStatusCode();

        var tasks = await response.Content
            .ReadFromJsonAsync<List<TaskSummary>>();

        Assert.NotNull(tasks);
        Assert.Single(tasks);
        Assert.Equal("B task 1", tasks[0].Title);
    }

    [Fact]
    public async Task Unauthenticated_Request_Returns_401()
    {
        _client.DefaultRequestHeaders.Authorization = null;
        var response = await _client.GetAsync("/api/tasks");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private record TaskSummary(int Id, string Title);
}

using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace backend.Tests;

/// <summary>
/// Verifies that the API rejects bad input with 400 Bad Request.
/// </summary>
public class ValidationTests : IClassFixture<TestFactory>
{
    private readonly HttpClient _client;

    public ValidationTests(TestFactory factory)
    {
        _client = factory.CreateClient();
    }

    // --- Task validation ------------------------------------------------------

    [Theory]
    [InlineData("")]          // empty string
    [InlineData("   ")]       // whitespace only — trimmed to empty before save
    public async Task Create_Task_With_Blank_Title_Returns_400(string title)
    {
        var token = await Helpers.RegisterAndGetToken(_client, $"v1_{Guid.NewGuid()}@test.com");
        _client.SetBearer(token);

        var response = await _client.PostAsJsonAsync("/api/tasks",
            new { title, description = (string?)null, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_Task_With_Null_Title_Returns_400()
    {
        var token = await Helpers.RegisterAndGetToken(_client, $"v2_{Guid.NewGuid()}@test.com");
        _client.SetBearer(token);

        // Explicitly send null for title
        var response = await _client.PostAsJsonAsync("/api/tasks",
            new { title = (string?)null, description = (string?)null, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_Task_With_Title_Exceeding_MaxLength_Returns_400()
    {
        var token = await Helpers.RegisterAndGetToken(_client, $"v3_{Guid.NewGuid()}@test.com");
        _client.SetBearer(token);

        var longTitle = new string('x', 201); // max is 200
        var response = await _client.PostAsJsonAsync("/api/tasks",
            new { title = longTitle, description = (string?)null, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Update_Task_With_Blank_Title_Returns_400()
    {
        var token = await Helpers.RegisterAndGetToken(_client, $"v4_{Guid.NewGuid()}@test.com");
        _client.SetBearer(token);
        var taskId = await Helpers.CreateTask(_client, "Valid title");

        var response = await _client.PutAsJsonAsync($"/api/tasks/{taskId}",
            new { title = "", description = (string?)null,
                  status = 0, dueDate = (DateTime?)null });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // --- Auth validation ------------------------------------------------------

    [Theory]
    [InlineData("notanemail", "Password1!")]
    [InlineData("", "Password1!")]
    public async Task Register_With_Invalid_Email_Returns_400(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new { email, password });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("valid@test.com", "short")]   // < 8 chars
    [InlineData("valid@test.com", "")]         // empty
    public async Task Register_With_Weak_Password_Returns_400(string email, string password)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new { email, password });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Register_With_Duplicate_Email_Returns_409()
    {
        var email = $"dup_{Guid.NewGuid()}@test.com";
        await Helpers.RegisterAndGetToken(_client, email);

        var response = await _client.PostAsJsonAsync("/api/auth/register",
            new { email, password = "Password1!" });

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_With_Wrong_Password_Returns_401()
    {
        var email = $"wp_{Guid.NewGuid()}@test.com";
        await Helpers.RegisterAndGetToken(_client, email);

        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { email, password = "WrongPassword1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_With_Unknown_Email_Returns_401()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login",
            new { email = "nobody@test.com", password = "Password1!" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

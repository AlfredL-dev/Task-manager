using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace backend.Tests;

/// <summary>
/// Shared helpers so every test doesn't repeat registration / login boilerplate.
/// </summary>
internal static class Helpers
{
    public static async Task<string> RegisterAndGetToken(
        HttpClient client,
        string email = "user@test.com",
        string password = "Password1!")
    {
        var res = await client.PostAsJsonAsync("/api/auth/register",
            new { email, password });

        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<TokenBody>();
        return body!.Token;
    }

    public static void SetBearer(this HttpClient client, string token) =>
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", token);

    public static async Task<int> CreateTask(
        HttpClient client,
        string title = "Test task")
    {
        var res = await client.PostAsJsonAsync("/api/tasks",
            new { title, description = (string?)null, dueDate = (DateTime?)null });

        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadFromJsonAsync<TaskBody>();
        return body!.Id;
    }

    private record TokenBody(string Token, string Email);
    private record TaskBody(int Id);
}

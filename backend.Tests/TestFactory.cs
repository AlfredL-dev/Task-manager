using backend;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace backend.Tests;

/// <summary>
/// Spins up the real HTTP pipeline with an isolated in-memory database per test run.
/// No external dependencies required — just dotnet test.
/// </summary>
public class TestFactory : WebApplicationFactory<Program>
{
    // Each factory instance gets its own DB so tests don't bleed into each other.
    private readonly string _dbName = Guid.NewGuid().ToString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace the real SQLite DB with an isolated in-memory DB
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));

            if (descriptor is not null)
                services.Remove(descriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });

        // Override JWT config with test values
        builder.UseSetting("Jwt:Key", "test-secret-key-that-is-long-enough-32chars!!");
        builder.UseSetting("Jwt:Issuer", "taskmanager-api");
        builder.UseSetting("Jwt:Audience", "taskmanager-client");
    }
}

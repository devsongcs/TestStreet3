using Microsoft.OpenApi.Models;
using MediatR;
using WebApp.Applications.Ports;
using WebApp.Adapters.Infrastructures.FileSystems;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ILocalFileSystem, LocalFileSystem>();

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
// Register controllers so MVC controllers / ApiController classes are discovered
builder.Services.AddControllers();
// Register MediatR handlers in this assembly (add other assemblies if needed)
builder.Services.AddMediatR(typeof(Program).Assembly);
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "TestStreet3 API",
        Version = "v1",
        Description = "기본 Swagger 문서입니다."
    });
});

var app = builder.Build();

app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "TestStreet3 v1");
        // Serve Swagger UI at application root (https://localhost:5001/)
        c.RoutePrefix = string.Empty;
    });

// Map controller routes and enable HTTPS redirection
app.MapControllers();
app.UseHttpsRedirection();


app.Run();
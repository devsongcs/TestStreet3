using System.Text;
using System.Text.Json;
using WebApp.Applications.Dtos;
using WebApp.Applications.Ports;

namespace WebApp.Adapters.Infrastructures.FileSystems;

public class LocalFileSystem : ILocalFileSystem
{
    private string _rootDirectory = Path.Combine(AppContext.BaseDirectory, "Volumes", "Rules");

    public LocalFileSystem()
    {
        if (!Directory.Exists(_rootDirectory))
            Directory.CreateDirectory(_rootDirectory);
    }

    public async Task<bool> CreateRuleAsync(CustomRule rule, CancellationToken cancellationToken)
    {
        try
        {
            var json = JsonSerializer.Serialize(rule, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            var filePath = Path.Combine(_rootDirectory, $"{rule.Id}.json");
            await File.WriteAllTextAsync(filePath, json, Encoding.UTF8, cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.Message);
            return false;
        }
    }

    public Task<bool> DeleteRuleAsync(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var file = Directory.GetFiles(_rootDirectory, $"{id}.json").FirstOrDefault();
            if (file == null)
                return Task.FromResult(false);

            File.Delete(file);
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"{ex.Message}");
            return Task.FromResult(false);
        }
    }

    public async Task<List<CustomRule>> GetRulesAsync(CancellationToken cancellationToken)
    {
        var files = Directory.GetFiles(_rootDirectory, "*.json");

        var rules = new List<CustomRule>();
        foreach (var file in files)
        {
            try
            {
                var json = await File.ReadAllTextAsync(file, Encoding.UTF8, cancellationToken);
                var rule = JsonSerializer.Deserialize<CustomRule>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (rule != null)
                {
                    rules.Add(rule);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to deserialize rule from {file}: {ex.Message}");
            }
        }
        return rules;
    }

    // public async Task<bool> CreateCsvFileAsync(string fileName, IReadOnlyList<string> contents, CancellationToken cancellationToken)
    // {
    //     try
    //     {
    //         var fileFullName = Path.Combine(_rootDirectory, fileName);

    //         await File.WriteAllLinesAsync(fileFullName, contents, Encoding.UTF8, cancellationToken);

    //         return true;
    //     }
    //     catch
    //     {
    //         return false;
    //     }
    // }
}

using System.Text;
using WebApp.Applications.Ports;

namespace WebApp.Adapters.Infrastructures.FileSystems;

public class LocalFileSystem : ILocalFileSystem
{
    private string _rootDirectory = Path.Combine(AppContext.BaseDirectory, "Volumes");

    public LocalFileSystem()
    {
        if (!Directory.Exists(_rootDirectory))
            Directory.CreateDirectory(_rootDirectory);
    }

    public async Task<bool> CreateCsvFileAsync(string fileName, IReadOnlyList<string> contents, CancellationToken cancellationToken)
    {
        try
        {
            var fileFullName = Path.Combine(_rootDirectory, fileName);

            await File.WriteAllLinesAsync(fileFullName, contents, Encoding.UTF8, cancellationToken);

            return true;
        }
        catch
        {
            return false;
        }
    }
}

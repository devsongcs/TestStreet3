namespace WebApp.Applications.Ports;

public interface ILocalFileSystem
{
    public Task<bool> CreateCsvFileAsync(string fileName, IReadOnlyList<string> contents, CancellationToken cancellationToken);
}

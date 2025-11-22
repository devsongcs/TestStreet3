using WebApp.Applications.Dtos.CustomRules;

namespace WebApp.Applications.Ports;

public interface ILocalFileSystem
{
    // public Task<bool> CreateCsvFileAsync(string fileName, IReadOnlyList<string> contents, CancellationToken cancellationToken);
    public Task<bool> CreateRuleAsync(CustomRule rule, CancellationToken cancellationToken);
    public Task<List<CustomRule>> GetRulesAsync(CancellationToken cancellationToken);
    public Task<bool> DeleteRuleAsync(Guid id, CancellationToken cancellationToken);
}

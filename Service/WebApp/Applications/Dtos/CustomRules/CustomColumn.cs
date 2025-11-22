using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos.CustomRules;

public sealed class CustomColumn
{
    public string Name { get; set; } = string.Empty;
    public DataType DataType { get; set; }
    public FieldOptions Options { get; set; } = default!;
}
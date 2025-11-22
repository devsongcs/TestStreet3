using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos;

public sealed class CustomColumn
{
    public string Name { get; set; } = string.Empty;
    public DataType DataType { get; set; }
    public FormatOptions Options { get; set; } = default!;
}
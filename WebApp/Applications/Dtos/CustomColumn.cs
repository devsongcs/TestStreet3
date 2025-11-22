using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos;

public sealed class CustomColumn
{
    public DataType DataType { get; set; }

    public string Name { get; set; } = string.Empty;
}

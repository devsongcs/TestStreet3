using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos.CustomRules;

public class CustomRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public int DataCount { get; set; }
    public FileFormatType ResultType { get; set; }
    // public bool UseSchedule { get; set; }
    // public int ScheduleInterval { get; set; }
    // public ScheduleType ScheduleType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public List<CustomColumn> Columns { get; set; } = [];
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
    public DateTime NextScheduleTime { get; set; } = DateTime.UtcNow;
}

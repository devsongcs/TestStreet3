using WebApp.Applications.Dtos.CustomRules;
using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos.ScheduleRules;

public sealed class ScheduleRule
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public bool UseSchedule { get; set; }
    public int ScheduleInterval { get; set; }
    public ScheduleType ScheduleType { get; set; }
    public List<CustomColumn> Columns { get; set; } = [];
    public DateTime CreateTime { get; set; } = DateTime.UtcNow;
    public DateTime NextScheduleTime { get; set; } = DateTime.UtcNow;
}


using WebApp.Applications.Dtos;
using WebApp.Domains.Rules;
using WebApp.Domains.Types;

namespace WebApp.Domains.Services;

public class GenDataSetService
{
    public Dictionary<string, IReadOnlyList<string>> GenerateDataSets(List<CustomColumn> columns, int dataCnt)
    {
        Dictionary<string, IReadOnlyList<string>> dataSets = new();

        foreach (var column in columns)
            dataSets.Add(column.Name, GenerateDatas(column, dataCnt));

        return dataSets;
    }


    private IReadOnlyList<string> GenerateDatas(CustomColumn column, int dataCnt) =>
        column.DataType switch
        {
            DataType.LineId => LineId.GetFaker(new Faker(), dataCnt),
            DataType.PartId => PartId.GetFaker(new Faker(), dataCnt),
            _ => new List<string>()
        };
}

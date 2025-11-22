
using WebApp.Applications.Dtos;
using WebApp.Domains.Rules;
using WebApp.Domains.Types;

namespace WebApp.Domains.Services;

public class GenDataSetService
{
    public Dictionary<(int Idx, string Name), IReadOnlyList<string>> GenerateDataSets(List<CustomColumn> columns, int dataCnt)
    {
        Dictionary<(int Idx, string Name), IReadOnlyList<string>> dataSets = new();

        int idx = 0;
        foreach (var column in columns)
            dataSets.Add((idx++, column.Name), GenerateDatas(column, dataCnt));
        return dataSets;
    }


    private IReadOnlyList<string> GenerateDatas(CustomColumn column, int dataCnt) =>
        column.DataType switch
        {
            DataType.StdLineId => LineId.GetFaker(new Faker(), dataCnt),
            DataType.StdPartId => PartId.GetFaker(new Faker(), dataCnt),
            DataType.StdStepId => StepId.GetFaker(new Faker(), dataCnt),
            DataType.CustomDataToString => 
                CustomDataToString.GetFaker(new Faker(), column.Options, dataCnt),
            _ => Enumerable.Repeat(string.Empty, dataCnt).ToList()
        };
}

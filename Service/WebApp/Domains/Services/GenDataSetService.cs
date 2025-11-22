
using WebApp.Applications.Dtos;
using WebApp.Domains.Rules;
using WebApp.Domains.Types;

namespace WebApp.Domains.Services;

public class GenDataSetService
{
    public (string fileName, Dictionary<string, IReadOnlyList<string>> dataSets) GenerateDataSets(string fileName, List<CustomColumn> columns, int dataCnt)
    {
        Dictionary<string, IReadOnlyList<string>> dataSets = new();

        foreach (var column in columns)
        {
            IReadOnlyList<string> datas = GenerateDatas(column, dataCnt);

            if(!column.Options.UseTitle)
                dataSets.Add(column.Name, datas);
            else 
                fileName = fileName.Replace($"{{{column.Name}}}", datas.First()); 
            
            if(column.DataType == DataType.StdStepId)
                dataSets.Add("Pno", GeneratePnoDatas(datas));
                
        }
        
        return (fileName, dataSets);
    }

    private IReadOnlyList<string> GenerateDatas(CustomColumn column, int dataCnt) =>
        column.DataType switch
        {
            DataType.StdLineId => LineId.GetFaker(new Faker(), dataCnt),
            DataType.StdPartId => PartId.GetFaker(new Faker(), dataCnt),
            DataType.StdStepId => StepId.GetFaker(new Faker(), dataCnt, column.Options.Pno),
            DataType.CustomDataToString => 
                CustomDataToString.GetFaker(new Faker(), column.Options, dataCnt),
            DataType.CustomDataToNumber =>
                CustomDataToNumber.GetFaker(new Faker(), column.Options, dataCnt)
                    .Select(n => n.ToString()).ToList(),
            _ => Enumerable.Repeat(string.Empty, dataCnt).ToList()
        };

    private IReadOnlyList<string> GeneratePnoDatas(IReadOnlyList<string> stepDatas)
    {
        List<string> pnoDatas = [];
        
        string preStepId = string.Empty;

        int pno = 0;
        foreach(string stepId in stepDatas)
        {
            if(stepId != preStepId)
            {
                pno = 0;
                preStepId = stepId;
                pnoDatas.Add(pno.ToString());    
            }
            else
                pnoDatas.Add((++pno).ToString());
        }
        
        return pnoDatas;
    }
}

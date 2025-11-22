namespace WebApp.Applications.Converters;

public static class DataPivotConverter
{   
    public static IReadOnlyList<string> ColumnToRow(Dictionary<string, IReadOnlyList<string>> dataSets, int dataCnt)
    {
        var names = dataSets.Keys.ToList();

        var rows = new List<string>();

        rows.Add(string.Join(",", names));

        for (int i = 0; i < dataCnt; i++)
        {
            var values = new List<string>(dataSets.Keys.Count);
            foreach (var k in dataSets.Keys)
                values.Add(dataSets[k][i]);
            
            rows.Add(string.Join(",", values));
        }

        return rows;
    }

}

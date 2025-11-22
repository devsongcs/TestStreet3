using WebApp.Applications.Dtos.CustomRules;
using WebApp.Domains.Types;

namespace WebApp.Domains.Rules;

public class CustomDataToString
{
    public static IReadOnlyList<string> GetFaker(Faker faker, FieldOptions options, int count) =>
        Enumerable.Range(0, count)
            .Select(_ => faker.Random.String2(options.MinLength, options.MaxLength, options.FormatType.ToDataFormatString()))
            .ToList();
}

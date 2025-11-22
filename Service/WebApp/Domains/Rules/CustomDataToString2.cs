using WebApp.Applications.Dtos.CustomRules;

namespace WebApp.Domains.Rules;

public class CustomDataToString2
{
    public static IReadOnlyList<string> GetFaker(Faker faker, FieldOptions options, int count) =>
        Enumerable.Range(0, count)
            .Select(_ => options.CustomValues[faker.Random.Int(0, options.CustomValues.Count - 1)])
            .ToList();
}
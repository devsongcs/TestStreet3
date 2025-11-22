using WebApp.Applications.Dtos;
using WebApp.Domains.Types;

namespace WebApp.Domains.Rules;

public class CustomDataToNumber
{
    public static IReadOnlyList<double> GetFaker(Faker faker, FormatOptions options, int count) =>
        Enumerable.Range(0, count)
            .Select(_ => (double)decimal.Round(faker.Random.Decimal(options.MinValue, options.MaxValue), options.Decimal))
            .ToList();            
}

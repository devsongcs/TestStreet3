using WebApp.Abstractions;

namespace WebApp.Domains.Rules;

public static class PartId
{
    public static IReadOnlyList<string> GetFaker(Faker faker, int count, int length = 6) =>
        Enumerable.Range(0, count)
            .Select(_ => string.Concat(            
                faker.Random.String2(1, Constants.DataFormat.UpperString),
                faker.Random.String2(6, Constants.DataFormat.UpperString + Constants.DataFormat.DigitsString),
                faker.Random.String2(1, Constants.DataFormat.UpperString)))
            .ToList();
}

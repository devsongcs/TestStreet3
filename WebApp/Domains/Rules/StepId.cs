using WebApp.Abstractions;

namespace WebApp.Domains.Rules;

public static class StepId
{
    public static IReadOnlyList<string> GetFaker(Faker faker, int count, int length = 8) =>
        Enumerable.Range(0, count)
            .Select(_ => string.Concat(            
                faker.Random.String2(2, Constants.DataFormat.UpperString),
                faker.Random.String2(6, Constants.DataFormat.DigitsString)))
            .ToList();
}

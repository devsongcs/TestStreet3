using WebApp.Abstractions;

namespace WebApp.Domains.Rules;

public static class LineId
{
    public static IReadOnlyList<string> GetFaker(Faker faker, int count, int length = 4) =>
        Enumerable.Range(0, count)
            .Select(_ => faker.Random.String2(length, Constants.DataFormat.UpperString))
            .ToList();
}
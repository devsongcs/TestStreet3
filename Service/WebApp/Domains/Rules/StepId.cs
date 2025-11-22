using WebApp.Abstractions;

namespace WebApp.Domains.Rules;

public static class StepId
{
    public static IReadOnlyList<string> GetFaker(Faker faker, int count, int pno = 1, int length = 8)
    {
        var result = new List<string>();
        
        while (result.Count < count)
        {
            var stepId = string.Concat(
                faker.Random.String2(2, Constants.DataFormat.UpperString),
                faker.Random.String2(6, Constants.DataFormat.DigitsString));
            
            // 1~pno 사이의 랜덤한 횟수만큼 동일 StepId를 반복
            var repeatCount = pno > 0 ? faker.Random.Int(1, pno) : 1;
            
            for (int i = 0; i < repeatCount && result.Count < count; i++)
            {
                result.Add(stepId);
            }
        }
        
        return result;
    }
}

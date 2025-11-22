using WebApp.Abstractions;

namespace WebApp.Domains.Types;

public enum DataFormatType
{
    UpperString,
    LowerString,
    DigitsString,
}


public static class DataFormatTypeExtensions
{
    public static string ToDataFormatString(this DataFormatType formatType) =>
        formatType switch
        {
            DataFormatType.UpperString => Constants.DataFormat.UpperString,
            DataFormatType.LowerString => Constants.DataFormat.LowerString,
            DataFormatType.DigitsString => Constants.DataFormat.DigitsString,
            _ => string.Empty,
        };
}
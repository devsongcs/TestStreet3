using System;
using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos;

public sealed class FormatOptions
{
    //String
    public DataFormatType FormatType { get; set; }
    public int MinLength { get; set; }
    public int MaxLength { get; set; }

    //Number
    public int MinValue { get; set; }
    public int MaxValue { get; set; }
    public int Decimal { get; set; }
}
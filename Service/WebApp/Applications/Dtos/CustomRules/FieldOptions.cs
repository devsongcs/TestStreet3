using System;
using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos.CustomRules;

public sealed class FieldOptions
{
    //Std
    public bool UseTitle { get; set; }
    public int Pno{ get; set; }
    
    //String
    public DataFormatType FormatType { get; set; }
    public int MinLength { get; set; }
    public int MaxLength { get; set; }
    public List<string> CustomValues { get; set; } = [];

    //Number
    public int MinValue { get; set; }
    public int MaxValue { get; set; }
    public int Decimal { get; set; }
}


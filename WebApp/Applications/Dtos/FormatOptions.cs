using System;
using WebApp.Domains.Types;

namespace WebApp.Applications.Dtos;

public sealed class FormatOptions
{
    public bool Use { get; set; }
    public DataFormatType FormatType { get; set; }
    public int MinLength { get; set; }
    public int MaxLength { get; set; }

    //Number일 경우 더 많음.
}
using System;
using MediatR;
using WebApp.Applications.Converters;
using WebApp.Applications.Dtos.CustomRules;
using WebApp.Domains.Services;
using WebApp.Domains.Types;

namespace WebApp.Applications;

public class GenerateTestData
{
    public sealed record Request(string FileName, List<CustomColumn> Columns, int DataCnt, FileFormatType FileFormatType) : IRequest<Response>;
    public sealed record Response(string FileName, string Content, string ContentType);

    public sealed class Handler : IRequestHandler<Request, Response>
    {
        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            (string fileName, string content, string contentType) = GenDataSets(request);

            return await Task.FromResult(new Response(fileName, content, contentType));
        }

        private (string fileName, string content, string contentType) GenDataSets(Request request)
        {
            GenDataSetService service = new();
            
            (string fileName, Dictionary<string, IReadOnlyList<string>> dataSets) = 
                service.GenerateDataSets(request.FileName, request.Columns, request.DataCnt);

            IReadOnlyList<string> csvLines = DataPivotConverter.ColumnToRow(dataSets, request.DataCnt);
            
            // 파일명 처리: 비어있으면 기본값 사용, 확장자 제거 후 .csv 추가
            if (string.IsNullOrWhiteSpace(fileName))
            {
                fileName = $"dataset-{DateTime.Now:yyyyMMddHHmmss}.csv";
            }
            else
            {
                fileName = Path.GetFileNameWithoutExtension(fileName) + ".csv";
            }

            string csvContent = string.Join("\n", csvLines);
            
            return (fileName, csvContent, "text/csv");
        }
    }
}


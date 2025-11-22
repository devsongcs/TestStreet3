using System;
using MediatR;
using WebApp.Applications.Converters;
using WebApp.Applications.Dtos;
using WebApp.Applications.Ports;
using WebApp.Domains.Services;
using WebApp.Domains.Types;

namespace WebApp.Applications;

public class PreviewTestData
{
    public sealed record Request(string FileName, List<CustomColumn> Columns, int DataCnt) : IRequest<Response>;
    public sealed record Response(string FileName, IReadOnlyList<string> DataSets);

    // public sealed class Handler(ILocalFileSystem fileSystem) : IRequestHandler<Request, Response>
    public sealed class Handler : IRequestHandler<Request, Response>
    {
        // private readonly ILocalFileSystem _fileSystem = fileSystem;

        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            (string fileName, IReadOnlyList<string> dataSets) = GenDataSets(request);

            // await _fileSystem.CreateCsvFileAsync(
            //     fileName: $"{Guid.NewGuid()}.csv",
            //     contents: dataSets,
            //     cancellationToken: cancellationToken);
            
            return await Task.FromResult(new Response(fileName, dataSets));
        }

        private (string fileName, IReadOnlyList<string> dataSets) GenDataSets(Request request)
        {
            GenDataSetService service = new();
            
            (string fileName, Dictionary<string, IReadOnlyList<string>> dataSets) = 
                service.GenerateDataSets(request.FileName, request.Columns, request.DataCnt);

            return (fileName, DataPivotConverter.ColumnToRow(dataSets, request.DataCnt));
        }
    }
}


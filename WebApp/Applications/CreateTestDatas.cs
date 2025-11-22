using System;
using MediatR;
using WebApp.Applications.Converters;
using WebApp.Applications.Dtos;
using WebApp.Applications.Ports;
using WebApp.Domains.Services;
using WebApp.Domains.Types;

namespace WebApp.Applications;

public class CreateTestDatas
{
    public sealed record Request(List<CustomColumn> Columns, int DataCnt, ResultType ResultType) : IRequest<Response>;
    public sealed record Response(IReadOnlyList<string> DataSets);

    public sealed class Handler(ILocalFileSystem fileSystem) : IRequestHandler<Request, Response>
    {
        private readonly ILocalFileSystem _fileSystem = fileSystem;

        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            IReadOnlyList<string> dataSets = GenDataSets(request);

            await _fileSystem.CreateCsvFileAsync(
                fileName: $"{Guid.NewGuid()}.csv",
                contents: dataSets,
                cancellationToken: cancellationToken);
            
            return await Task.FromResult(new Response(dataSets));
        }

        private IReadOnlyList<string> GenDataSets(Request request)
        {
            GenDataSetService service = new();
            
            Dictionary<(int Idx, string Name), IReadOnlyList<string>> dataSets = 
                service.GenerateDataSets(request.Columns, request.DataCnt);

            return DataPivotConverter.ColumnToRow(dataSets, request.DataCnt);
        }
    }
}

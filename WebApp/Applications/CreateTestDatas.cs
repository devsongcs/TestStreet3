using System;
using MediatR;
using WebApp.Applications.Converters;
using WebApp.Applications.Dtos;
using WebApp.Domains.Services;

namespace WebApp.Applications;

public class CreateTestDatas
{
    public sealed record Request(List<CustomColumn> Columns, int DataCnt) : IRequest<Response>;
    // public sealed record Response(Dictionary<string, IReadOnlyList<string>> DataSets);
    public sealed record Response(IReadOnlyList<string> DataSets);

    public sealed class Handler : IRequestHandler<Request, Response>
    {
        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            GenDataSetService service = new();
            var dataSets = service.GenerateDataSets(request.Columns, request.DataCnt);

            return await Task.FromResult(new Response(DataPivotConverter.ColumnToRow(dataSets, request.DataCnt)));
        }
    }
}

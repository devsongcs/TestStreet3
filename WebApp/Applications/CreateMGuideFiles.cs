// using System;
// using MediatR;
// using WebApp.Applications.Converters;
// using WebApp.Applications.Dtos;
// using WebApp.Domains.Services;
// using WebApp.Domains.Types;

// namespace WebApp.Applications;

// public class CreateMGuideFiles
// {
//     public sealed record Request(int DataCnt) : IRequest<Response>;
//     public sealed record Response(IReadOnlyList<string> DataSets);

//     public sealed class Handler : IRequestHandler<Request, Response>
//     {
//         public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
//         {
//             GenDataSetService service = new();
            
//             Dictionary<(int Idx, string Name), IReadOnlyList<string>> dataSets = 
//                 service.GenerateDataSets(request.Columns, request.DataCnt);

//             return await Task.FromResult(new Response(DataPivotConverter.ColumnToRow(dataSets, request.DataCnt)));
//         }
//     }

//     private void CreateMGuideColumns()
//     {
//         List<CustomColumn> columns =
//         [
//             new CustomColumn 
//             {
//                 DataType = DataType.StdLineId,
//                 Name = "LineId"
//             },
//             new CustomColumn
//             {
//                 DataType = DataType.StdPartId,
//                 Name = "PartId"
//             },
//             new CustomColumn
//             {
//                 DataType = DataType.StdStepId,
//                 Name = "StepId"
//             },
//             new CustomColumn
//             {
//                 DataType = DataType.DataSequence,
//                 Name = "Pno"
//             },
//         ];
//     }
// }

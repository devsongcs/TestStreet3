using System.ComponentModel.DataAnnotations;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using WebApp.Applications;
using WebApp.Applications.Dtos;
using WebApp.Domains.Types;

namespace WebApp.Adapters.Presentations;

[ApiController]
[Route("[controller]")]
public class ApiController : ControllerBase
{
    private readonly IMediator _mediator;

    public ApiController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// TEST 데이터를 생성합니다.
    /// </summary>
    /// <remarks>
    /// 샘플 요청:
    ///
    ///     POST /api/testdatas
    ///
    /// DataType:
    /// - 0: LineId
    /// - 1: PartId
    /// - 2: StepId
    /// - 3: None
    /// </remarks>
    [HttpPost("testdatas")]
    public async Task<IActionResult> CreateTestData(
        [FromBody][Required] List<CustomColumn> columns,
        [Required] int dataCnt,
        [Required] ResultType resultType)
    {
        if (columns == null || columns.Count == 0)
            return BadRequest("Columns are required.");

        var res = await _mediator.Send(new CreateTestDatas.Request(columns, dataCnt, resultType));

        return Ok(res.DataSets);
    }
}

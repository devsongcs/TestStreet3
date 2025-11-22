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

    [HttpPost("pre-view")]
    public async Task<IActionResult> PreviewTestData(
        [FromQuery] string? fileName,
        [FromBody][Required] List<CustomColumn> columns,
        [FromQuery][Required] int dataCnt)
    {
        if (columns == null || columns.Count == 0)
            return BadRequest("Columns are required.");

        var fileNameValue = string.IsNullOrEmpty(fileName) ? string.Empty : fileName;
        var res = await _mediator.Send(new PreviewTestData.Request(fileNameValue, columns, dataCnt));

        return Ok(new { fileName = res.FileName ?? string.Empty, dataSets = res.DataSets });
    }

    [HttpPost("create-rule")]
    public async Task<IActionResult> CreateRule(
        [FromBody][Required] CustomRule rule)
    {
        if (rule == null)
            return BadRequest("Rule is required.");

        await _mediator.Send(new CreateRule.Request(rule));

        return Ok(new { success = true });
    }

    [HttpGet("get-rules")]
    public async Task<IActionResult> GetRules()
    {
        var res = await _mediator.Send(new GetRules.Request());

        return Ok(res.Rules);
    }

    [HttpDelete("delete-rule")]
    public async Task<IActionResult> DeleteRule(
        [FromQuery][Required] Guid id)
    {
        await _mediator.Send(new DeleteRule.Request(id));

        return Ok(new { success = true });
    }
}

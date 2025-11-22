using MediatR;
using Microsoft.AspNetCore.Mvc;
using WebApp.Applications;
using WebApp.Applications.Dtos;

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

	
	[HttpPost("testdatas")]
	public async Task<IActionResult> CreateTestData([FromBody] List<CustomColumn> columns, int dataCnt)
	{
		if (columns == null || columns.Count == 0)
			return BadRequest("Columns are required.");

		var res = await _mediator.Send(new CreateTestDatas.Request(columns, dataCnt));

		return Ok(res.DataSets);
	}
}

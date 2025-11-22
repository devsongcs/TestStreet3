using MediatR;
using WebApp.Applications.Dtos;
using WebApp.Applications.Ports;

namespace WebApp.Applications;

public sealed class GetRules
{
    public sealed record Request() : IRequest<Response>;
    public sealed record Response(List<CustomRule> Rules);

    public sealed class Handler(ILocalFileSystem fileSystem) : IRequestHandler<Request, Response>
    {
        private readonly ILocalFileSystem _fileSystem = fileSystem;

        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            var rules = await _fileSystem.GetRulesAsync(
                cancellationToken: cancellationToken);

            return new Response(rules);
        }
    }
}

using MediatR;
using WebApp.Applications.Dtos;
using WebApp.Applications.Ports;

namespace WebApp.Applications;

public sealed class DeleteRule
{
    public sealed record Request(Guid Id) : IRequest<Response>;
    public sealed record Response();

    public sealed class Handler(ILocalFileSystem fileSystem) : IRequestHandler<Request, Response>
    {
        private readonly ILocalFileSystem _fileSystem = fileSystem;

        public async Task<Response> Handle(Request request, CancellationToken cancellationToken)
        {
            await _fileSystem.DeleteRuleAsync(
                id: request.Id,
                cancellationToken: cancellationToken);

            return new Response();
        }
    }
}

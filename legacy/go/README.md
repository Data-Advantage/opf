# pptx.dev/go

Go client for the [pptx.dev](https://pptx.dev) REST API.

## Installation

```bash
go get pptx.dev/go@latest
```

## Usage

```go
import pptxdev "pptx.dev/go"

client, err := pptxdev.NewClient("your-api-key")
if err != nil {
    log.Fatal(err)
}

// Validate an OPF document
result, err := client.Validate(ctx, opfJSON)
```

## Requirements

Go 1.22+.

## Releasing

Releases are cut from the monorepo by pushing a version tag. The CI workflow
(`.github/workflows/publish-sdk-go.yml`) runs `go test -race ./...`, `gofmt`,
and `go vet`, then creates a GitHub Release automatically.

**Steps:**

1. Update any version-related references if needed.
2. Commit and push to `main`.
3. Push a tag using the monorepo subdirectory prefix:

```bash
git tag go/v0.2.0
git push origin go/v0.2.0
```

The tag format `go/v<semver>` tells the Go module proxy where to find the
module inside this monorepo. Do **not** use a bare `v*` tag — that would
conflict with other modules in the repo.

The GitHub Release is created automatically. No registry publish is needed;
the Go module proxy fetches directly from the tagged commit.

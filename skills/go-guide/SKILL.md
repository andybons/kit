---
name: go-guide
description: Go code and API rules to follow when writing or reviewing Go. Covers module and package layout, naming, API design, errors, concurrency, testing, and comments. Use before adding a package, an exported API, or tests.
---

# Go guide

One rule per line, each with its source. If the repo's AGENTS.md or CLAUDE.md differs, the repo wins.

## Layout

- Put commands in `cmd/` and private packages in `internal/`; keep `cmd/` to flags and wiring. [go.dev/doc/modules/layout](https://go.dev/doc/modules/layout)
- Give each package one purpose, named for what it provides. [go.dev/blog/package-names](https://go.dev/blog/package-names)
- Do not name a package `util`, `common`, `helpers`, `types`, `api`, or `base`. [go.dev/blog/package-names](https://go.dev/blog/package-names)
- Group files by concern, not by kind (no `types.go`, `interfaces.go` that collect everything). [go.dev/blog/package-names](https://go.dev/blog/package-names)
- A large file or function needs a reason; split by concern before it grows. [go.dev/doc/effective_go](https://go.dev/doc/effective_go)

## Naming

- Follow Effective Go and Code Review Comments for names, initialisms, and receivers. [go.dev/doc/effective_go#names](https://go.dev/doc/effective_go#names), [go.dev/wiki/CodeReviewComments](https://go.dev/wiki/CodeReviewComments)
- Do not stutter: `session.Store`, not `session.SessionStore`. [go.dev/blog/package-names](https://go.dev/blog/package-names)

## API design

- Take `context.Context` first and never store it in a struct. [pkg.go.dev/context](https://pkg.go.dev/context)
- Accept interfaces, return concrete types. [go.dev/wiki/CodeReviewComments#interfaces](https://go.dev/wiki/CodeReviewComments#interfaces)
- Declare small interfaces in the consumer, not the producer. [go.dev/wiki/CodeReviewComments#interfaces](https://go.dev/wiki/CodeReviewComments#interfaces)
- Make the zero value useful, or provide a constructor that validates. [go.dev/doc/effective_go#allocation_new](https://go.dev/doc/effective_go#allocation_new)
- Configure with one options struct whose zero values are documented defaults. [go.dev/doc/effective_go#composite_literals](https://go.dev/doc/effective_go#composite_literals)
- Document concurrency safety, ownership, and `Close` semantics (idempotent or not, what it waits for). [go.dev/doc/comment](https://go.dev/doc/comment)
- Treat errors as values: export sentinels or typed errors, match with `errors.Is` and `errors.As`, never by string. [go.dev/blog/go1.13-errors](https://go.dev/blog/go1.13-errors)
- Wrap with `%w` when the caller may match the cause; otherwise do not expose it. [go.dev/blog/go1.13-errors](https://go.dev/blog/go1.13-errors)
- Return streams as `iter.Seq` or `iter.Seq2`. [pkg.go.dev/iter](https://pkg.go.dev/iter)
- Keep no global state: inject loggers (`*slog.Logger`) and environment readers. [go.dev/wiki/CodeReviewComments#dont-panic](https://go.dev/wiki/CodeReviewComments#dont-panic), [pkg.go.dev/log/slog](https://pkg.go.dev/log/slog)
- Report API breaks with apidiff before release. [pkg.go.dev/golang.org/x/exp/cmd/apidiff](https://pkg.go.dev/golang.org/x/exp/cmd/apidiff)

## Concurrency

- Share memory by communicating. [go.dev/doc/effective_go#sharing](https://go.dev/doc/effective_go#sharing)
- One goroutine owns each piece of data; others get copies or views.
- Every goroutine has an owner that starts it and a way to stop it. [go.dev/wiki/CodeReviewComments#goroutine-lifetimes](https://go.dev/wiki/CodeReviewComments#goroutine-lifetimes)

## Testing

- Write contract tests through the public entry point; test internals only for a stated reason (a race no contract test reaches, a codec with many edge cases).
- Use table rows for variants. [go.dev/wiki/TableDrivenTests](https://go.dev/wiki/TableDrivenTests)
- Use `testing/synctest` for time; do not sleep. [go.dev/blog/synctest](https://go.dev/blog/synctest)
- Write repo tooling in Go (`go run ./internal/<tool>` or a test), not shell scripts.

## Comments

- Write no history in comments (no PR numbers, dates, or "changed from"); commit messages hold history.
- Say what the code does and why it must; do not restate the code. [go.dev/doc/comment](https://go.dev/doc/comment)

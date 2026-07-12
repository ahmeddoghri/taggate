# Contributing

Thanks for your interest in improving this project!

## Development setup

```bash
npm install
npm test
```

## Before opening a pull request

- Keep changes focused. One logical change per PR, not a drive-by rewrite.
- Add or update tests for any behaviour you change. CI runs the typecheck,
  tests, and build on Node 18, 20, and 22, so it will find you.
- Run the full local check before pushing:
  ```bash
  npx tsc --noEmit && npm test && npm run build
  ```
- Keep the README accurate if you change public behaviour.

## Reporting bugs

Open an issue with a minimal reproduction, the expected vs. actual behaviour,
and your environment (OS, Node version). For security issues, see
[SECURITY.md](SECURITY.md) instead of filing a public issue.

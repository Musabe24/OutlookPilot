# OutlookPilot

## Development

Use Node.js 24.22.3 (see `.nvmrc`). From a clean checkout:

```sh
npm ci
npm run build
npm run typecheck
npm test
```

The test command builds the project before running the Node.js test runner.

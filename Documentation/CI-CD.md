# CI/CD

The frontend GitHub Actions workflow runs on pushes and pull requests to `main` and `develop`.

Required checks:

- Install dependencies with `npm ci`
- Lint
- Type check
- Production build

CI uses safe placeholder `VITE_API_URL` and `VITE_WS_URL` values. Production values must be configured in the hosting platform.


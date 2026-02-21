# GitHub Secrets & Environment Variables Guide

This guide explains how to set up and pass environment variables and secrets to GitHub Actions CI workflows securely, without exposing sensitive data. This is specific to the IoT Playground project.

## Project Environment Variables

Your `.env.local` file contains:

| Variable | Type | Source | Example |
|----------|------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public | Clerk Dashboard | `pk_test_...` |
| `CLERK_SECRET_KEY` | **Secret** ⚠️ | Clerk Dashboard | `sk_test_...` |
| `DATABASE_URL` | Config | Local/Turso | `file:./prisma/dev.db` |
| `NEXT_PUBLIC_MQTT_BROKER_URL` | Config | Local/Broker | `ws://localhost:9001` |
| `NEXT_PUBLIC_WS_URL` | Config | Local/Server | `http://localhost:3001` |

---

## Setting Up GitHub Secrets

### Step 1: Navigate to Repository Settings

1. Go to your repository on **github.com**
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**

### Step 2: Create Secrets

Click **New repository secret** and add these secrets:

#### For Production Builds

```
SECRET_NAME: CLERK_SECRET_KEY
VALUE: sk_test_xxxxxxxxxxxxx
```

If using a production Turso/libSQL database:

```
SECRET_NAME: DATABASE_URL
VALUE: libsql://your-db-url.turso.io?authToken=your-token
```

**Note:** Keep `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local` — it's meant to be public (the `NEXT_PUBLIC_` prefix indicates this).

---

## Using Secrets in GitHub Actions Workflows

### Current CI Workflow

Your `.github/workflows/ci.yml` currently uses dummy values for builds:

```yaml
build:
  name: Build
  runs-on: ubuntu-latest
  steps:
    # ...
    - name: Build
      run: pnpm build:ci
      env:
        CI: "true"
        NEXT_PUBLIC_CI: "true"
        DATABASE_URL: "file:./prisma/dev.db"  # Local SQLite for CI
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_build_dummy_key_do_not_use"
        CLERK_SECRET_KEY: "sk_test_build_dummy_key_do_not_use"
```

### Adding Real Secrets to Workflows

If you need to use real secrets (e.g., for E2E tests), reference them like this:

```yaml
- name: Build with real secrets
  run: pnpm build
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
```

**Or use environment-level secrets for production deployments:**

```yaml
deploy:
  name: Deploy to Production
  runs-on: ubuntu-latest
  environment: production
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy
      run: npm run deploy
      env:
        # These automatically come from the 'production' environment secrets
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
```

---

## Best Practices for This Project

### 1. **Protect Sensitive Secrets**

These should **always** be GitHub Secrets:
- ✅ `CLERK_SECRET_KEY` — Never commit or expose
- ✅ `DATABASE_URL` (if using production) — Never commit or expose
- ✅ Any API tokens or authentication keys

These can be in `.env.local` (local dev only):
- ✅ `NEXT_PUBLIC_*` variables — Public by design
- ✅ `NEXT_PUBLIC_MQTT_BROKER_URL` — Development endpoints
- ✅ Local database paths

### 2. **Use Different Secrets Per Environment**

In **Settings** → **Environments**, create environments for:

```
environment: development
  - NEXT_PUBLIC_MQTT_BROKER_URL: ws://dev.example.com:9001
  - DATABASE_URL: (development database)

environment: staging
  - NEXT_PUBLIC_MQTT_BROKER_URL: ws://staging.example.com:9001
  - DATABASE_URL: (staging database)

environment: production
  - NEXT_PUBLIC_MQTT_BROKER_URL: ws://api.example.com:9001
  - CLERK_SECRET_KEY: (production key)
  - DATABASE_URL: (production database)
```

Then in your workflow:

```yaml
jobs:
  deploy-production:
    environment: production
    steps:
      - name: Deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
        run: ./deploy.sh
```

### 3. **Never Log Secrets**

```yaml
# ❌ WRONG - Never do this
- name: Debug
  run: echo ${{ secrets.CLERK_SECRET_KEY }}

# ✅ CORRECT - Secrets are automatically masked in logs
- name: Build
  env:
    CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
  run: pnpm build
```

### 4. **Keep .env.local in .gitignore**

Your `.env.local` should **never** be committed. Verify in `.gitignore`:

```
.env.local
.env.*.local
```

### 5. **Use Dummy Values for CI**

For CI builds that don't need real credentials (like linting/building), use dummy values:

```yaml
env:
  CLERK_SECRET_KEY: "sk_test_build_dummy_key_do_not_use"
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_build_dummy_key_do_not_use"
  DATABASE_URL: "file:./prisma/dev.db"
```

---

## Step-by-Step: Setting Up for E2E Testing

If you want to enable E2E tests with real secrets:

### 1. Get Test Credentials

From Clerk Dashboard, generate test API keys (separate from production):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_abc123...
CLERK_SECRET_KEY = sk_test_xyz789...
```

### 2. Add to GitHub Secrets

```
Settings → Secrets and variables → Actions → New secret

Name: CLERK_SECRET_KEY
Value: sk_test_xyz789...
```

```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_abc123...
```

### 3. Update Workflow

Uncomment and update `.github/workflows/ci.yml`:

```yaml
  playwright:
    name: Playwright E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Run E2E tests
        run: pnpm playwright test
        env:
          DATABASE_URL: "file:./prisma/e2e.db"
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Secret Not Found in Workflow

**Error:** `The secret CLERK_SECRET_KEY is not defined`

**Solution:**
1. Verify the secret name matches exactly (case-sensitive)
2. Check **Settings** → **Secrets** to confirm it exists
3. Ensure the workflow file uses correct syntax: `${{ secrets.SECRET_NAME }}`

### Credentials Exposed in Logs

**Problem:** A secret was accidentally printed in workflow logs

**Solution:**
1. Immediately delete/rotate the secret in Settings
2. Remove any logs containing the secret
3. Re-add the secret with a new value

### Build Fails with Missing Secrets

**Problem:** Build succeeds locally but fails in CI

**Solution:**
- For CI builds, use dummy values (as currently done)
- For deployment jobs, reference secrets with `${{ secrets.NAME }}`
- Check if the workflow step has the correct `env` block

---

## Reference

- [GitHub Actions - Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions - Using Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [Clerk - API Keys](https://clerk.com/docs/dashboard/api-keys)
- [Prisma - Database URLs](https://www.prisma.io/docs/reference/database-reference/connection-urls)

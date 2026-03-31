# Plan: Adding Tests to LFA2

## What Are We Doing and Why?

This project has zero tests today. Tests are code that runs *your* code and checks that it behaves correctly. When you make changes later, tests catch things you accidentally broke — before your users do.

We'll start with **5 tests** across two categories, chosen because they're easy to understand, cover real risk areas, and don't require a database or external services to run.

---

## Testing Concepts Used Here

### Unit Tests
A unit test calls a single function with known inputs and checks that the output matches what you expect. They're fast (milliseconds), need no external services, and are the easiest type of test to write.

**When a unit test fails**, it means: "this function no longer returns what it used to for this input." You then decide — did I break it, or did I intentionally change the behavior and need to update the test?

### API / Integration Tests
These start up your Express app and send real HTTP requests to it, but with fake ("mocked") versions of the database and external services. They test that your endpoints accept the right inputs, return the right status codes, and handle errors gracefully.

**When an API test fails**, it means: "this endpoint's behavior changed — it returns a different status code, different data shape, or crashes on input it used to handle." This is valuable because endpoints are the contract between your frontend and backend.

---

## The 5 Starter Tests

### Test 1: `normalizePort()` — Unit Test
**File being tested:** `bin/www`, the `normalizePort` function
**What it does:** Converts a string like `"3000"` into the number `3000`, passes through named pipes like `"myPipe"`, and rejects invalid values like `"-1"`.

**Test cases:**
- `"3000"` → returns `3000` (normal port)
- `"abc"` → returns `"abc"` (named pipe, valid in Node)
- `"-1"` → returns `false` (negative port invalid)
- `"0"` → returns `0` (edge case — port 0 means "pick any available")

**What failure looks like:** If someone changes the port parsing logic and breaks it, this test catches it immediately. Low-stakes but a great first test because it's a pure function with no dependencies.

**Note:** `normalizePort` is currently not exported from `bin/www`, so we'll need to extract it to a small utility file (e.g., `utils/normalize-port.js`) and import it in both `bin/www` and the test. This is a common pattern — making code testable sometimes means restructuring it slightly.

### Test 2: CORS origin parsing — Unit Test
**File being tested:** `routes/index.js`, lines 35-39
**What it does:** Reads `ALLOWED_ORIGINS` env var, splits it by comma into an array. Falls back to `'http://localhost:8080'` if unset.

**Test cases:**
- `ALLOWED_ORIGINS='https://example.com'` → `['https://example.com']`
- `ALLOWED_ORIGINS='https://a.com,https://b.com'` → `['https://a.com', 'https://b.com']`
- `ALLOWED_ORIGINS` not set → `'http://localhost:8080'`

**What failure looks like:** If CORS breaks, your frontend gets blocked from calling the backend — the browser shows a CORS error and all API calls fail. This is a common and confusing production issue, so testing it is high value.

**Note:** Like Test 1, the CORS config logic would benefit from being extracted into a small helper function so it can be tested directly.

### Test 3: 1stDibs scraper HTML parsing — Unit Test
**File being tested:** `first-dibs-scraper.js`, the `getProductHeroImage` function
**What it does:** Fetches a 1stDibs product page and scrapes the item name, image URL, and sold status from the HTML.

**Test cases:**
- Given HTML with an unsold item → returns `{ cdnUrl: '...', itemName: '...', sold: false }`
- Given HTML with a sold item → returns the correct image (index [1], not [0]) and `sold: true`
- Given HTML with no matching elements → returns `{ cdnUrl: 'NoMatch', itemName: 'NoMatch', sold: 'NoMatch' }`

**What failure looks like:** 1stDibs changes their HTML structure (new CSS classes, different DOM layout), the scraper silently returns wrong data or crashes. This test won't prevent that breakage, but it *documents* exactly what HTML structure the scraper expects — so when it breaks, you know immediately what to look for.

**How we test it:** Instead of hitting the real 1stDibs website, we "mock" the HTTP call (intercept it and return fake HTML that we control). This way the test is fast, reliable, and doesn't depend on 1stDibs being up.

### Test 4: `GET /items` endpoint — API Test
**File being tested:** `routes/index.js`, the `/items` endpoint
**What it does:** Returns a paginated list of store items, with optional sorting and filtering.

**Test cases:**
- Request with no query params → uses defaults (page 1, sort by recent, all items, 36 per page)
- Request with `?page=2&sort=name&unsold=true` → passes correct values to DB query
- DB error → returns 500 status

**What failure looks like:** The store page shows no items, shows wrong items, or crashes. Since this is the main public-facing endpoint, it's the most important one to protect.

**How we test it:** We mock the database connection pool so no real DB is needed. The mock returns fake data, and we verify the endpoint sends it back with the right format and status code.

### Test 5: `DELETE /item/:image` auth check — API Test
**File being tested:** `routes/index.js`, the `DELETE /item/:image` endpoint
**What it does:** Deletes an item, but only if the request includes a valid Google OAuth token.

**Test cases:**
- Request with no token → returns 403 Forbidden
- Request with invalid token → returns 403 Forbidden
- Request with valid token → deletes the item, returns 200

**What failure looks like:** If auth checking breaks, either (a) anyone can delete items from your store without logging in, or (b) legitimate admins can't delete items. Both are bad. This test ensures the auth gate works.

**How we test it:** We mock both the Google OAuth verification and the database. The test verifies that the endpoint actually *checks* the auth result before proceeding.

---

## Framework Options

### Option A: Jest (Recommended)
**What it is:** The most popular JavaScript testing framework. It's an all-in-one package: test runner, assertion library, and mocking built in.

**Pros:**
- Huge community, tons of examples and Stack Overflow answers
- Built-in mocking (`jest.mock()`) — no extra packages needed
- Great error messages when tests fail
- Snapshot testing if you ever want to test frontend components
- `--watch` mode re-runs tests automatically as you save files

**Cons:**
- Heavier install (~30MB of dependencies)
- Can be slow to start on first run (has a compilation step)
- Some configuration quirks with ES modules (though this project uses CommonJS, so no issue)

**What you'd add to `package.json`:**
```json
"devDependencies": {
  "jest": "^29.0.0",
  "supertest": "^6.0.0"
}
```
`supertest` is a small library for making HTTP requests against your Express app in tests (used for Tests 4 and 5).

**To run tests:** `npm test` (after adding `"test": "jest"` to scripts)

### Option B: Vitest
**What it is:** A newer, faster test runner built on Vite. API is nearly identical to Jest.

**Pros:**
- Significantly faster than Jest (especially on re-runs)
- Jest-compatible API — almost everything you learn transfers
- Better ES module support (future-proofing)
- Built-in TypeScript support if you ever add it

**Cons:**
- Smaller community than Jest (fewer Stack Overflow answers)
- Fewer tutorials aimed at beginners
- Pulls in Vite as a dependency (adds weight, though Vite is fast)

**What you'd add:**
```json
"devDependencies": {
  "vitest": "^1.0.0",
  "supertest": "^6.0.0"
}
```

**To run tests:** `npm test` (after adding `"test": "vitest run"` to scripts)

### Option C: Node.js Built-in Test Runner
**What it is:** Node.js 20+ includes a native test runner — no install required.

**Pros:**
- Zero dependencies to install
- Built into the runtime you're already using
- Simple API, less "magic"
- Fast startup

**Cons:**
- Limited mocking support — you'd need to write more boilerplate or add a mocking library
- Less mature ecosystem (fewer examples, guides, plugins)
- Error messages are less polished than Jest
- No `--watch` mode built in (as of Node 20)

**What you'd add:**
```json
"devDependencies": {
  "supertest": "^6.0.0"
}
```

**To run tests:** `node --test` or `npm test` with `"test": "node --test"`

---

## Recommendation

**Go with Jest (Option A).** It's the most beginner-friendly, has the best documentation, and its built-in mocking makes Tests 3-5 much simpler to write. The community resources matter a lot when you're learning — if you hit a wall, there's almost certainly a blog post or answer for it.

---

## What the Test Files Would Look Like

```
lfa2-backend/
  __tests__/              ← test directory (Jest convention)
    normalize-port.test.js
    cors-config.test.js
    first-dibs-scraper.test.js
    items-endpoint.test.js
    delete-item-auth.test.js
  utils/
    normalize-port.js     ← extracted from bin/www
    cors-config.js        ← extracted from routes/index.js
```

Each `.test.js` file follows the same structure:
```js
describe('what you are testing', () => {
  test('specific scenario', () => {
    // Arrange: set up inputs
    // Act: call the function
    // Assert: check the result
    expect(result).toBe(expectedValue)
  })
})
```

---

## Running Tests Locally

Tests run directly with `npm test` in the `lfa2-backend/` directory — they don't need Docker since they don't connect to any real services. This is one of the benefits of tests: fast feedback without spinning up containers.

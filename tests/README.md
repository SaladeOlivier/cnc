# Testing Documentation

This directory contains comprehensive unit tests for the CNC data scraper.

## Test Framework

We use [Vitest](https://vitest.dev/) as our testing framework:
- **Fast**: Runs tests in parallel with hot module reloading
- **ESM-compatible**: Works seamlessly with ES modules
- **Familiar API**: Compatible with Jest-like syntax

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-reruns on file changes)
npm run test:watch

# Run tests with UI (browser-based test viewer)
npm run test:ui
```

## Test Structure

### Test Files

- **`extractors.test.js`**: Tests for standard commission extractors
  - Project name extraction (with filtering of non-project headers)
  - Beneficiary extraction (handles old & new formats, &nbsp; entities)
  - Talent extraction (multiple talents, different field labels)
  - Amount extraction (various number formats)
  - Commission date extraction

- **`parsers.test.js`**: Tests for parser warning logs
  - Warnings when no projects found
  - Format-specific parser behaviors

- **`utils.test.js`**: Tests for utility functions
  - `slugify`: URL-safe slug generation
  - `normalizeName`: Name normalization
  - `parseFrenchDate`: French date parsing
  - `splitTalentNames`: Multi-talent name splitting

- **`ids.test.js`**: Tests for deterministic ID generation
  - Commission IDs
  - Project IDs
  - Beneficiary IDs
  - Talent IDs

### Fixtures

The `fixtures/` directory contains real HTML samples from different commission formats:
- `old-format-project.html`: Pre-2022 format with `&nbsp;` entities
- `new-format-project.html`: Current format
- `members-header.html`: Non-project header that should be filtered

## Testing Philosophy

### 1. Test Real-World Formats
Our tests use actual HTML samples from the CNC website to ensure extractors handle real-world quirks:
- Non-breaking spaces (`&nbsp;`)
- Inconsistent spacing
- Various field label variations
- Multiple data formats

### 2. Test Edge Cases
We test for common failure modes:
- Missing fields
- Multiple values in a single field
- Headers that look like projects but aren't
- Different date formats
- Special characters in names

### 3. Test Determinism
ID generation tests verify that:
- Same input → same ID (critical for partial updates)
- Different capitalizations → same ID (deduplication)
- Special characters are handled consistently

## Adding Tests for New Formats

When you encounter a new commission format:

1. **Save an HTML sample** to `fixtures/`:
   ```bash
   curl "https://www.cnc.fr/commission-url" > tests/scraper/fixtures/new-format.html
   ```

2. **Add test cases** to the appropriate test file:
   ```javascript
   it('should extract from new format', () => {
     const html = `<your HTML sample>`;
     const $ = cheerio.load(html);
     const result = extractProjectName($('body'));
     expect(result).toBe('Expected Project Name');
   });
   ```

3. **Run tests** to verify:
   ```bash
   npm run test:watch
   ```

4. **Update extractors** if tests fail, then verify tests pass

## Test Coverage

Current coverage:
- ✅ 79 tests passing
- ✅ Old format (pre-2022) with `&nbsp;`
- ✅ New format (2022+)
- ✅ Non-project header filtering
- ✅ Deterministic ID generation
- ✅ Multi-talent parsing
- ✅ French date parsing (all 12 months)
- ✅ Parser warning logs

## Continuous Integration

Tests should be run:
- Before committing changes
- Before deploying
- When adding new aid type parsers
- When encountering scraping errors in production

## Debugging Failed Tests

If tests fail:

1. **Check the error message** - it shows expected vs actual
2. **Run in watch mode** - `npm run test:watch` for faster iteration
3. **Use test UI** - `npm run test:ui` for visual debugging
4. **Add console.log** in extractor code to see what's being parsed
5. **Update fixtures** if the website HTML has changed

## Future Test Additions

As we scale to 90+ commission formats, consider adding:
- Integration tests for full commission parsing
- Snapshot tests for data structure consistency
- Performance tests for large data sets
- Tests for data manager (merge/cleanup operations)
- Tests for parser format detection logic

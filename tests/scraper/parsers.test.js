import { describe, it, expect, vi } from 'vitest';
import * as cheerio from 'cheerio';
import { parseCommissionPage } from '../../scripts/scraper/parsers.js';

describe('Parser warnings', () => {
  it('should warn when no projects found in standard format', () => {
    const warnSpy = vi.spyOn(console, 'warn');

    const html = `<div class="clearfix">
      <p class="inline">3 juillet 2025</p>
      <p>Some text without projects</p>
    </div>`;
    const $ = cheerio.load(html);

    parseCommissionPage('https://test.com', 'Test Aid', $);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('No projects found in commission')
    );

    warnSpy.mockRestore();
  });

  it('should NOT warn when projects are found', () => {
    const warnSpy = vi.spyOn(console, 'warn');

    const html = `<div class="col-12 col-lg-10">
      <div class="clearfix">
        <p class="inline">3 juillet 2025</p>
      </div>
      <br>
      <div class="clearfix">
        <p><strong>Test Project</strong><br>
        Talent : Test Talent<br>
        Bénéficiaire : Test Company<br>
        Aide accordée : 10 000 €</p>
      </div>
    </div>`;
    const $ = cheerio.load(html);

    parseCommissionPage('https://test.com', 'Test Aid', $);

    // Should not have the "No projects found" warning
    const noProjectWarnings = warnSpy.mock.calls.filter(call =>
      call[0].includes('No projects found')
    );
    expect(noProjectWarnings).toHaveLength(0);

    warnSpy.mockRestore();
  });
});

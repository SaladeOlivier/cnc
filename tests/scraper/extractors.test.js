import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import {
  extractProjectName,
  extractProjectBeneficiary,
  extractProjectTalent,
  extractProjectAmount,
  extractCommissionDate
} from '../../scripts/scraper/extractors.js';

describe('extractProjectName', () => {
  it('should extract project name from old format with &nbsp;', () => {
    const html = `<p><strong>Les Groos </strong>– 10 x 1 min – Animation<br>
Talent&nbsp;: <strong>David MIRAILLES</strong><br>
Bénéficiaire&nbsp;: David Mirailles<br>
Aide accordée&nbsp;: 14 000 €</p>`;
    const $ = cheerio.load(html);
    const $temp = $('p');

    const result = extractProjectName($temp);
    expect(result).toBe('Les Groos');
  });

  it('should extract project name from new format', () => {
    const html = `<strong>A MUSEE VOUS</strong> – 26 x 7 min – Documentaire

Talent : <strong>Chloé CATOEN et Marine MANICHINI</strong>

Bénéficiaire : Bigger Than Fiction

Aide accordée : 100 000 €`;
    const $ = cheerio.load(html);
    const $temp = $('body');

    const result = extractProjectName($temp);
    expect(result).toBe('A MUSEE VOUS');
  });

  it('should filter out "Membres présents" headers', () => {
    const html = `<p><strong><em>Membres présents à la commission réunie le 14 juin 2022&nbsp;</em>: </strong></p>`;
    const $ = cheerio.load(html);
    const $temp = $('p');

    const result = extractProjectName($temp);
    expect(result).toBeNull();
  });

  it('should filter out "Commission réunie" headers', () => {
    const html = `<p><strong>Commission réunie le 21 février 2019</strong></p>`;
    const $ = cheerio.load(html);
    const $temp = $('p');

    const result = extractProjectName($temp);
    expect(result).toBeNull();
  });

  it('should filter out "Résultats commission" headers', () => {
    const html = `<p><strong>Résultats commission du 14 juin 2022</strong></p>`;
    const $ = cheerio.load(html);
    const $temp = $('p');

    const result = extractProjectName($temp);
    expect(result).toBeNull();
  });

  it('should extract ACM Distribution project name', () => {
    const html = `<p><em><strong>City of Wind</strong></em> de Lkhagvadulam Purev-Ochir (Mongolie)</p>`;
    const $ = cheerio.load(html);
    const $temp = $('p');

    const result = extractProjectName($temp);
    expect(result).toBe('City of Wind');
  });
});

describe('extractProjectBeneficiary', () => {
  it('should extract beneficiary from old format with &nbsp;', () => {
    const text = `Les Groos – 10 x 1 min – Animation
Talent : David MIRAILLES
Bénéficiaire : David Mirailles
Aide accordée : 14 000 €`;

    const result = extractProjectBeneficiary(text);
    expect(result).toBe('David Mirailles');
  });

  it('should extract beneficiary from new format', () => {
    const text = `A MUSEE VOUS – 26 x 7 min – Documentaire

Talent : Chloé CATOEN et Marine MANICHINI

Bénéficiaire : Bigger Than Fiction

Aide accordée : 100 000 €`;

    const result = extractProjectBeneficiary(text);
    expect(result).toBe('Bigger Than Fiction');
  });

  it('should handle "Beneficiaire" without accent', () => {
    const text = `Project Name
Beneficiaire : Test Company
Aide accordée : 10 000 €`;

    const result = extractProjectBeneficiary(text);
    expect(result).toBe('Test Company');
  });

  it('should stop at "Aide" keyword', () => {
    const text = `Project Name
Bénéficiaire : Test Company Aide accordée : 10 000 €`;

    const result = extractProjectBeneficiary(text);
    expect(result).toBe('Test Company');
  });
});

describe('extractProjectTalent', () => {
  it('should extract single talent from old format with &nbsp;', () => {
    const text = `Les Groos – 10 x 1 min – Animation
Talent : David MIRAILLES
Bénéficiaire : David Mirailles
Aide accordée : 14 000 €`;

    const result = extractProjectTalent(text);
    expect(result).toBe('David MIRAILLES');
  });

  it('should extract multiple talents from new format', () => {
    const text = `A MUSEE VOUS – 26 x 7 min – Documentaire

Talent : Chloé CATOEN et Marine MANICHINI

Bénéficiaire : Bigger Than Fiction

Aide accordée : 100 000 €`;

    const result = extractProjectTalent(text);
    expect(result).toBe('Chloé CATOEN et Marine MANICHINI');
  });

  it('should stop at "Bénéficiaire" keyword', () => {
    const text = `Project Name
Talent : John Doe Bénéficiaire : Test Company`;

    const result = extractProjectTalent(text);
    expect(result).toBe('John Doe');
  });

  it('should handle "Auteur" alternative', () => {
    const text = `Project Name
Auteur : Jane Smith
Bénéficiaire : Test Company`;

    const result = extractProjectTalent(text);
    expect(result).toBe('Jane Smith');
  });
});

describe('extractProjectAmount', () => {
  it('should extract amount from old format with &nbsp; and spaces', () => {
    const text = `Les Groos – 10 x 1 min – Animation
Talent : David MIRAILLES
Bénéficiaire : David Mirailles
Aide accordée : 14 000 €`;

    const result = extractProjectAmount(text);
    expect(result).toBe(14000);
  });

  it('should extract amount from new format', () => {
    const text = `A MUSEE VOUS – 26 x 7 min – Documentaire
Talent : Chloé CATOEN et Marine MANICHINI
Bénéficiaire : Bigger Than Fiction
Aide accordée : 100 000 €`;

    const result = extractProjectAmount(text);
    expect(result).toBe(100000);
  });

  it('should extract amount with no spaces', () => {
    const text = `Project Name
Aide accordée : 50000 €`;

    const result = extractProjectAmount(text);
    expect(result).toBe(50000);
  });

  it('should extract ACM Distribution amount', () => {
    const text = `City of Wind de Lkhagvadulam Purev-Ochir (Mongolie)

Soutien de 54 500 € pour la distribution`;

    const result = extractProjectAmount(text);
    expect(result).toBe(54500);
  });

  it('should handle amounts with "(aide au pilote)" annotation', () => {
    const text = `Clash Courtois – 10 x 3 min – Fiction
Talent : Jérémy Strohm
Bénéficiaire : Centurions
Aide accordée : 5 000 € (aide au pilote)`;

    const result = extractProjectAmount(text);
    expect(result).toBe(5000);
  });
});

describe('extractCommissionDate', () => {
  it('should extract date from p.inline', () => {
    const html = `<div>
      <p class="inline">3 juillet 2025</p>
    </div>`;
    const $ = cheerio.load(html);

    const result = extractCommissionDate($);
    expect(result).toBe('2025-07-03');
  });

  it('should extract date from title fallback', () => {
    const html = `<div>
      <h1>Commission du 24 avril 2024</h1>
    </div>`;
    const $ = cheerio.load(html);

    const result = extractCommissionDate($);
    expect(result).toBe('2024-04-24');
  });

  it('should handle months with accents', () => {
    const html = `<div>
      <p class="inline">21 février 2019</p>
    </div>`;
    const $ = cheerio.load(html);

    const result = extractCommissionDate($);
    expect(result).toBe('2019-02-21');
  });
});

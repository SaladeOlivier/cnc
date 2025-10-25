import { describe, it, expect } from 'vitest';
import {
  slugify,
  normalizeName,
  parseFrenchDate,
  splitTalentNames
} from '../../scripts/scraper/utils.js';

describe('slugify', () => {
  it('should convert text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should remove accents', () => {
    expect(slugify('Café Crème')).toBe('cafe-creme');
    expect(slugify('José García')).toBe('jose-garcia');
  });

  it('should handle apostrophes', () => {
    expect(slugify("L'Amour")).toBe('lamour');
    expect(slugify("C'est")).toBe('cest');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
  });

  it('should remove special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world');
    expect(slugify('Test (2024)')).toBe('test-2024');
  });

  it('should trim hyphens', () => {
    expect(slugify('-Hello-')).toBe('hello');
    expect(slugify('Hello World-')).toBe('hello-world');
  });
});

describe('normalizeName', () => {
  it('should preserve original casing', () => {
    expect(normalizeName('john doe')).toBe('john doe');
    expect(normalizeName('JOHN DOE')).toBe('JOHN DOE');
    expect(normalizeName('John Doe')).toBe('John Doe');
  });

  it('should preserve capitalization patterns', () => {
    expect(normalizeName('Jean-Claude')).toBe('Jean-Claude');
    expect(normalizeName('McDonald')).toBe('McDonald');
  });

  it('should normalize whitespace', () => {
    expect(normalizeName('  John   Doe  ')).toBe('John Doe');
    expect(normalizeName('John\t\tDoe')).toBe('John Doe');
  });

  it('should normalize accents to composed form', () => {
    // NFC normalization ensures é is stored as single character, not e + combining accent
    expect(normalizeName('josé garcía')).toBe('josé garcía');
    expect(normalizeName('José García')).toBe('José García');
  });
});

describe('parseFrenchDate', () => {
  it('should parse standard French date', () => {
    expect(parseFrenchDate('3 juillet 2025')).toBe('2025-07-03');
    expect(parseFrenchDate('24 avril 2024')).toBe('2024-04-24');
  });

  it('should handle dates with accents', () => {
    expect(parseFrenchDate('21 février 2019')).toBe('2019-02-21');
    expect(parseFrenchDate('1 décembre 2023')).toBe('2023-12-01');
  });

  it('should handle single digit days', () => {
    expect(parseFrenchDate('1 janvier 2024')).toBe('2024-01-01');
    expect(parseFrenchDate('9 mars 2024')).toBe('2024-03-09');
  });

  it('should handle all French months', () => {
    const months = [
      ['15 janvier 2024', '2024-01-15'],
      ['15 février 2024', '2024-02-15'],
      ['15 mars 2024', '2024-03-15'],
      ['15 avril 2024', '2024-04-15'],
      ['15 mai 2024', '2024-05-15'],
      ['15 juin 2024', '2024-06-15'],
      ['15 juillet 2024', '2024-07-15'],
      ['15 août 2024', '2024-08-15'],
      ['15 septembre 2024', '2024-09-15'],
      ['15 octobre 2024', '2024-10-15'],
      ['15 novembre 2024', '2024-11-15'],
      ['15 décembre 2024', '2024-12-15']
    ];

    months.forEach(([input, expected]) => {
      expect(parseFrenchDate(input)).toBe(expected);
    });
  });
});

describe('splitTalentNames', () => {
  it('should split names by "et"', () => {
    const result = splitTalentNames('Chloé CATOEN et Marine MANICHINI');
    expect(result).toEqual(['Chloé CATOEN', 'Marine MANICHINI']);
  });

  it('should split names by comma', () => {
    const result = splitTalentNames('John Doe, Jane Smith, Bob Johnson');
    expect(result).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
  });

  it('should handle combination of comma and "et"', () => {
    const result = splitTalentNames('John Doe, Jane Smith et Bob Johnson');
    expect(result).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
  });

  it('should handle single name', () => {
    const result = splitTalentNames('David MIRAILLES');
    expect(result).toEqual(['David MIRAILLES']);
  });

  it('should trim whitespace', () => {
    const result = splitTalentNames('  John Doe  ,  Jane Smith  et  Bob Johnson  ');
    expect(result).toEqual(['John Doe', 'Jane Smith', 'Bob Johnson']);
  });

  it('should handle "et" with different cases', () => {
    const result = splitTalentNames('John Doe ET Jane Smith');
    expect(result).toEqual(['John Doe', 'Jane Smith']);
  });
});

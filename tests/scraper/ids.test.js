import { describe, it, expect } from 'vitest';
import {
  generateCommissionId,
  generateProjectId,
  generateBeneficiaryId,
  generateTalentId
} from '../../scripts/scraper/ids.js';

describe('generateCommissionId', () => {
  it('should generate deterministic commission ID', () => {
    const id = generateCommissionId('CNC Talent', '2025-07-03');
    expect(id).toBe('com_cnc-talent_2025-07-03');
  });

  it('should handle aid names with special characters', () => {
    const id = generateCommissionId("Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)", '2024-04-24');
    expect(id).toBe('com_fonds-daide-aux-createurs-video-sur-internet-cnc-talent_2024-04-24');
  });

  it('should handle missing date', () => {
    const id = generateCommissionId('CNC Talent', null);
    expect(id).toBe('com_cnc-talent_no-date');
  });

  it('should be deterministic (same inputs = same output)', () => {
    const id1 = generateCommissionId('ACM Distribution', '2024-04-24');
    const id2 = generateCommissionId('ACM Distribution', '2024-04-24');
    expect(id1).toBe(id2);
  });
});

describe('generateProjectId', () => {
  it('should generate deterministic project ID', () => {
    const id = generateProjectId('CNC Talent', 'A MUSEE VOUS', '2025-07-03');
    expect(id).toBe('pro_cnc-talent_a-musee-vous_2025-07-03');
  });

  it('should handle project names with special characters', () => {
    const id = generateProjectId('CNC Talent', "L'Amour (2024)", '2025-07-03');
    expect(id).toBe('pro_cnc-talent_lamour-2024_2025-07-03');
  });

  it('should truncate long project names', () => {
    const longName = 'This is a very long project name that should be truncated to prevent extremely long IDs';
    const id = generateProjectId('CNC Talent', longName, '2025-07-03');
    const projectSlug = id.split('_')[2];
    expect(projectSlug.length).toBeLessThanOrEqual(50);
  });

  it('should handle missing date', () => {
    const id = generateProjectId('CNC Talent', 'Test Project', null);
    expect(id).toBe('pro_cnc-talent_test-project_no-date');
  });

  it('should be deterministic (same inputs = same output)', () => {
    const id1 = generateProjectId('CNC Talent', 'City of Wind', '2024-04-24');
    const id2 = generateProjectId('CNC Talent', 'City of Wind', '2024-04-24');
    expect(id1).toBe(id2);
  });
});

describe('generateBeneficiaryId', () => {
  it('should generate deterministic beneficiary ID', () => {
    const id = generateBeneficiaryId('Bigger Than Fiction');
    expect(id).toBe('ben_bigger-than-fiction');
  });

  it('should handle names with accents', () => {
    const id = generateBeneficiaryId('Société Française');
    expect(id).toBe('ben_societe-francaise');
  });

  it('should handle names with apostrophes', () => {
    const id = generateBeneficiaryId("L'Autre Cinéma");
    expect(id).toBe('ben_lautre-cinema');
  });

  it('should be deterministic (same inputs = same output)', () => {
    const id1 = generateBeneficiaryId('Test Company');
    const id2 = generateBeneficiaryId('Test Company');
    expect(id1).toBe(id2);
  });

  it('should normalize similar names to same ID', () => {
    const id1 = generateBeneficiaryId('Test Company');
    const id2 = generateBeneficiaryId('TEST COMPANY');
    expect(id1).toBe(id2);
  });
});

describe('generateTalentId', () => {
  it('should generate deterministic talent ID', () => {
    const id = generateTalentId('David MIRAILLES');
    expect(id).toBe('tal_david-mirailles');
  });

  it('should handle names with accents', () => {
    const id = generateTalentId('José García');
    expect(id).toBe('tal_jose-garcia');
  });

  it('should handle hyphenated names', () => {
    const id = generateTalentId('Jean-Claude Van Damme');
    expect(id).toBe('tal_jean-claude-van-damme');
  });

  it('should be deterministic (same inputs = same output)', () => {
    const id1 = generateTalentId('Chloé CATOEN');
    const id2 = generateTalentId('Chloé CATOEN');
    expect(id1).toBe(id2);
  });

  it('should normalize similar names to same ID', () => {
    const id1 = generateTalentId('John Doe');
    const id2 = generateTalentId('JOHN DOE');
    expect(id1).toBe(id2);
  });
});

import { normalizeName, slugify } from './utils.js';
import { generateBeneficiaryId, generateTalentId } from './ids.js';

// Data structures with ID-based relationships
export const data = {
  commissions: new Map(),      // id -> commission object
  projects: new Map(),          // id -> project object
  beneficiaries: new Map(),     // id -> beneficiary object
  people: new Map(),            // id -> person object
  talents: new Map()            // id -> talent object (can be person or organization)
};

/**
 * Get or create a beneficiary with deduplication
 */
export function getOrCreateBeneficiary(name) {
  if (!name || name.trim() === '') return null;

  const normalizedName = normalizeName(name);
  const id = generateBeneficiaryId(name);

  // Check if beneficiary already exists
  if (data.beneficiaries.has(id)) {
    const beneficiary = data.beneficiaries.get(id);

    // Update the name to the most recent capitalization if it's "better"
    // Prefer names with proper capitalization over all-caps
    const existingName = beneficiary.name;
    const hasProperCase = /[a-z]/.test(normalizedName) && /[A-Z]/.test(normalizedName);
    const existingHasProperCase = /[a-z]/.test(existingName) && /[A-Z]/.test(existingName);

    if (hasProperCase && !existingHasProperCase) {
      beneficiary.name = normalizedName;
    }

    return id;
  }

  // Create new beneficiary
  data.beneficiaries.set(id, {
    id,
    slug: slugify(name),
    name: normalizedName,
    projectIds: [],
    commissionIds: []
  });

  return id;
}

/**
 * Get or create a talent (person or organization) with deduplication
 */
export function getOrCreateTalent(name) {
  if (!name || name.trim() === '') return null;

  const normalizedName = normalizeName(name);
  const id = generateTalentId(name);

  // Check if talent already exists
  if (data.talents.has(id)) {
    const talent = data.talents.get(id);

    // Update the name to the most recent capitalization if it's "better"
    // Prefer names with proper capitalization over all-caps
    const existingName = talent.name;
    const hasProperCase = /[a-z]/.test(normalizedName) && /[A-Z]/.test(normalizedName);
    const existingHasProperCase = /[a-z]/.test(existingName) && /[A-Z]/.test(existingName);

    if (hasProperCase && !existingHasProperCase) {
      talent.name = normalizedName;
    }

    return id;
  }

  // Create new talent
  data.talents.set(id, {
    id,
    slug: slugify(name),
    name: normalizedName,
    projectIds: [],
    commissionIds: []  // Track commissions where this talent is a member/president
  });

  return id;
}

/**
 * Add project reference to beneficiary
 */
export function linkProjectToBeneficiary(projectId, beneficiaryId) {
  if (!beneficiaryId) return;

  const beneficiary = data.beneficiaries.get(beneficiaryId);
  if (beneficiary && !beneficiary.projectIds.includes(projectId)) {
    beneficiary.projectIds.push(projectId);
  }
}

/**
 * Add project reference to talent
 */
export function linkProjectToTalent(projectId, talentId) {
  if (!talentId) return;

  const talent = data.talents.get(talentId);
  if (talent && !talent.projectIds.includes(projectId)) {
    talent.projectIds.push(projectId);
  }
}

/**
 * Add commission reference to talent
 */
export function linkCommissionToTalent(commissionId, talentId) {
  if (!talentId) return;

  const talent = data.talents.get(talentId);
  if (talent) {
    if (!talent.commissionIds) {
      talent.commissionIds = [];
    }
    if (!talent.commissionIds.includes(commissionId)) {
      talent.commissionIds.push(commissionId);
    }
  }
}

/**
 * Add commission reference to beneficiary
 */
export function linkCommissionToBeneficiary(commissionId, beneficiaryId) {
  if (!beneficiaryId) return;

  const beneficiary = data.beneficiaries.get(beneficiaryId);
  if (beneficiary && !beneficiary.commissionIds.includes(commissionId)) {
    beneficiary.commissionIds.push(commissionId);
  }
}

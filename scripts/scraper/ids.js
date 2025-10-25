import { slugify } from './utils.js';

/**
 * Generate deterministic commission ID from aid name and date
 * Format: com_<aid-slug>_<date>
 * Example: com_cnc-talent_2025-07-03
 */
export function generateCommissionId(aidName, date) {
  const aidSlug = slugify(aidName);
  const dateSlug = date || 'no-date';
  return `com_${aidSlug}_${dateSlug}`;
}

/**
 * Generate deterministic project ID from aid name, project name, and commission date
 * Format: pro_<aid-slug>_<project-slug>_<date>
 * We include date to handle cases where same project name appears in different commissions
 * Example: pro_cnc-talent_a-musee-vous_2025-07-03
 */
export function generateProjectId(aidName, projectName, commissionDate) {
  const aidSlug = slugify(aidName);
  const projectSlug = slugify(projectName).substring(0, 50); // Limit length
  const dateSlug = commissionDate || 'no-date';
  return `pro_${aidSlug}_${projectSlug}_${dateSlug}`;
}

/**
 * Generate deterministic beneficiary ID from name
 * Format: ben_<name-slug>
 * Example: ben_dada-media
 */
export function generateBeneficiaryId(name) {
  const slug = slugify(name);
  return `ben_${slug}`;
}

/**
 * Generate deterministic talent ID from name
 * Format: tal_<name-slug>
 * Example: tal_fouzia-kechkech
 */
export function generateTalentId(name) {
  const slug = slugify(name);
  return `tal_${slug}`;
}

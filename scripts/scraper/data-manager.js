import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { data } from './entities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load existing data to enable partial updates
 * - Loads all existing beneficiaries and talents for deduplication
 * - Loads existing commissions/projects from OTHER aids (to preserve them)
 * - Updates ID counters to avoid conflicts
 */
export function loadExistingData(targetAids) {
  const mainDataPath = join(__dirname, '..', '..', 'data', 'cnc-data.json');

  if (!existsSync(mainDataPath)) {
    console.log('No existing data found, starting fresh...');
    return null;
  }

  console.log('Loading existing data for partial update...');
  const existingData = JSON.parse(readFileSync(mainDataPath, 'utf-8'));

  // Load ALL beneficiaries and talents (for deduplication across all aids)
  if (existingData.beneficiaries) {
    existingData.beneficiaries.forEach(b => {
      data.beneficiaries.set(b.id, {
        ...b,
        projectIds: b.projectIds || [],
        commissionIds: b.commissionIds || []
      });
    });
    console.log(`  Loaded ${data.beneficiaries.size} existing beneficiaries`);
  }

  if (existingData.talents) {
    existingData.talents.forEach(t => {
      data.talents.set(t.id, {
        ...t,
        projectIds: t.projectIds || [],
        commissionIds: t.commissionIds || []
      });
    });
    console.log(`  Loaded ${data.talents.size} existing talents`);
  }

  // Store commissions and projects from OTHER aids (to preserve them)
  const preservedData = {
    commissions: [],
    projects: []
  };

  if (existingData.commissions) {
    preservedData.commissions = existingData.commissions.filter(
      c => !targetAids.includes(c.aidName)
    );
    console.log(`  Preserving ${preservedData.commissions.length} commissions from other aids`);
  }

  if (existingData.projects) {
    // Keep projects that belong to preserved commissions
    const preservedCommissionIds = new Set(preservedData.commissions.map(c => c.id));
    preservedData.projects = existingData.projects.filter(
      p => preservedCommissionIds.has(p.commissionId)
    );
    console.log(`  Preserving ${preservedData.projects.length} projects from other aids`);
  }

  return preservedData;
}

/**
 * Cleanup orphaned entities (beneficiaries/talents with no project references)
 */
export function cleanupOrphanedEntities() {
  // Get all project IDs that actually exist
  const existingProjectIds = new Set(data.projects.keys());

  // Clean up beneficiaries
  for (const [id, beneficiary] of data.beneficiaries) {
    // Filter out non-existent project references
    beneficiary.projectIds = beneficiary.projectIds.filter(
      projId => existingProjectIds.has(projId)
    );

    // Remove beneficiary if it has no projects
    if (beneficiary.projectIds.length === 0) {
      data.beneficiaries.delete(id);
    }
  }

  // Clean up talents
  for (const [id, talent] of data.talents) {
    // Filter out non-existent project references
    talent.projectIds = talent.projectIds.filter(
      projId => existingProjectIds.has(projId)
    );

    // Keep talent if it has projects OR is a commission member/president
    if (talent.projectIds.length === 0 && (!talent.commissionIds || talent.commissionIds.length === 0)) {
      data.talents.delete(id);
    }
  }
}

/**
 * Merge newly scraped data with preserved data from other aids
 */
export function mergeWithPreservedData(preservedData) {
  if (!preservedData) return;

  console.log('\nMerging with preserved data from other aids...');

  // Add preserved commissions to the data
  preservedData.commissions.forEach(c => {
    data.commissions.set(c.id, c);
  });

  // Add preserved projects to the data
  preservedData.projects.forEach(p => {
    data.projects.set(p.id, p);
  });

  console.log(`  Total commissions after merge: ${data.commissions.size}`);
  console.log(`  Total projects after merge: ${data.projects.size}`);
}

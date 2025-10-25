import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { slugify } from './utils.js';
import { data } from './entities.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Save per-aid source files for easy reference and debugging
 */
export function savePerAidSourceFiles(targetAids) {
  console.log('\nSaving per-aid source files...');
  const sourcesDir = join(__dirname, '..', '..', 'data', 'sources');
  mkdirSync(sourcesDir, { recursive: true });

  targetAids.forEach(aidName => {
    // Get commissions for this aid
    const aidCommissions = Array.from(data.commissions.values())
      .filter(c => c.aidName === aidName);

    // Get projects for this aid
    const commissionIds = new Set(aidCommissions.map(c => c.id));
    const aidProjects = Array.from(data.projects.values())
      .filter(p => commissionIds.has(p.commissionId));

    // Get beneficiaries for this aid
    const projectIds = new Set(aidProjects.map(p => p.id));
    const aidBeneficiaries = Array.from(data.beneficiaries.values())
      .filter(b => b.projectIds.some(pId => projectIds.has(pId)));

    // Get talents for this aid
    const aidTalents = Array.from(data.talents.values())
      .filter(t =>
        t.projectIds.some(pId => projectIds.has(pId)) ||
        t.commissionIds.some(cId => commissionIds.has(cId))
      );

    const aidData = {
      aidName,
      scrapedAt: new Date().toISOString(),
      commissions: aidCommissions,
      projects: aidProjects,
      beneficiaries: aidBeneficiaries,
      talents: aidTalents,
      stats: {
        totalCommissions: aidCommissions.length,
        totalProjects: aidProjects.length,
        totalBeneficiaries: aidBeneficiaries.length,
        totalTalents: aidTalents.length
      }
    };

    const filename = `${slugify(aidName)}.json`;
    const filepath = join(sourcesDir, filename);
    writeFileSync(filepath, JSON.stringify(aidData, null, 2), 'utf-8');
    console.log(`  Saved: ${filename} (${aidCommissions.length} commissions, ${aidProjects.length} projects)`);
  });
}

/**
 * Save main combined data file
 */
export function saveMainDataFile(targetAids, preservedData) {
  console.log('\nSaving main data file...');

  // Convert Maps to Arrays and create denormalized views for JSON serialization
  const commissionsArray = Array.from(data.commissions.values());
  const projectsArray = Array.from(data.projects.values());
  const beneficiariesArray = Array.from(data.beneficiaries.values());
  const talentsArray = Array.from(data.talents.values());

  // Get list of all unique aid names in the final data
  const allAidNames = [...new Set(commissionsArray.map(c => c.aidName))].sort();

  // Create denormalized output (backward compatible with old structure)
  const output = {
    // Normalized data (with IDs)
    commissions: commissionsArray,
    projects: projectsArray,
    beneficiaries: beneficiariesArray,
    talents: talentsArray,
    people: Array.from(data.people.values()),

    // Metadata
    metadata: {
      scrapedAt: new Date().toISOString(),
      totalCommissions: data.commissions.size,
      totalProjects: data.projects.size,
      totalBeneficiaries: data.beneficiaries.size,
      totalTalents: data.talents.size,
      dataStructure: 'normalized',
      version: '2.0',
      scrapedAids: targetAids,  // Aids that were just scraped
      allAids: allAidNames,      // All aids present in the data
      isPartialUpdate: preservedData !== null
    }
  };

  // Save to JSON
  const outputDir = join(__dirname, '..', '..', 'data');
  mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'cnc-data.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\n=== Scraping Complete ===');
  if (output.metadata.isPartialUpdate) {
    console.log(`✓ Partial update completed for ${targetAids.length} aid(s)`);
    console.log(`  Scraped aids: ${targetAids.join(', ')}`);
    console.log(`  Total aids in data: ${output.metadata.allAids.length}`);
  } else {
    console.log(`✓ Full scrape completed for ${targetAids.length} aid(s)`);
  }
  console.log(`\nFinal totals:`);
  console.log(`  Commissions: ${output.metadata.totalCommissions}`);
  console.log(`  Projects: ${output.metadata.totalProjects}`);
  console.log(`  Beneficiaries: ${output.metadata.totalBeneficiaries}`);
  console.log(`  Talents: ${output.metadata.totalTalents}`);
  console.log(`\nData saved to: ${outputPath}`);

  return output;
}

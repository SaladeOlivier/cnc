import { splitTalentNames } from './utils.js';
import { generateCommissionId, generateProjectId } from './ids.js';
import {
  extractCommissionDate,
  extractCommissionMembers,
  extractProjectName,
  extractProjectBeneficiary,
  extractProjectTalent,
  extractProjectAmount
} from './extractors.js';
import {
  data,
  getOrCreateBeneficiary,
  getOrCreateTalent,
  linkProjectToBeneficiary,
  linkProjectToTalent,
  linkCommissionToTalent,
  linkCommissionToBeneficiary
} from './entities.js';

/**
 * Parse a commission detail page
 * @param {string} url - The URL of the commission page
 * @param {string} aidName - The aid name from the search query
 * @param {object} $ - Cheerio instance
 */
export function parseCommissionPage(url, aidName, $) {
  console.log(`Parsing commission: ${url}`);

  // Use modular extraction function for date
  const commissionDate = extractCommissionDate($, url);

  // Generate deterministic commission ID
  const commissionId = generateCommissionId(aidName, commissionDate);

  // Extract commission metadata
  const commissionData = {
    id: commissionId,
    url,
    date: commissionDate,
    aidName: aidName || null,
    presidentId: null,
    memberIds: [],
    projectIds: []
  };

  // Use modular extraction function for members
  const onMemberFound = (memberName) => {
    const talentId = getOrCreateTalent(memberName);
    if (talentId) {
      linkCommissionToTalent(commissionId, talentId);
    }
    return talentId;
  };

  const members = extractCommissionMembers($, onMemberFound, url);
  commissionData.presidentId = members.presidentId;
  commissionData.memberIds = members.memberIds;

  // Extract projects - they can be in <p> tags or spread across <br> within a single <p>
  let currentCategory = null;

  $('.col-12.col-lg-10 .clearfix').each((_idx, clearfixDiv) => {
    const $clearfix = $(clearfixDiv);

    // Iterate through children of each clearfix div
    $clearfix.children().each((_i, el) => {
      const $el = $(el);

      // Track category headers
      if ($el.is('h3')) {
        currentCategory = $el.text().trim();
        return;
      }

      // Parse project paragraphs
      if ($el.is('p')) {
        const html = $el.html();
        if (!html) return;

        // Check if this paragraph contains <strong> or <b> tags (project name indicator)
        if (!html.includes('<strong>') && !html.includes('<b>')) return;

        const text = $el.text();

        // Skip paragraphs that are clearly not projects
        const nonProjectPatterns = [
          /membres?\s+présents?\s+(à|a)\s+la\s+commission/i,
          /composition\s+de\s+la\s+commission/i,
          /commission\s+(réunie|spéciale)/i,
          /^résultats?\s+commission/i
        ];

        const isNonProject = nonProjectPatterns.some(pattern => pattern.test(text));
        if (isNonProject) return;

        // Try to split by double <br> which separates multiple projects in one <p> (new format)
        const projectBlocks = html.split(/<br\s*\/?>\s*<br\s*\/?>/i);

        // If no double <br> splits found, treat entire <p> as one project (old format)
        if (projectBlocks.length === 1) {
          const projectId = parseProject(html, currentCategory, commissionId, aidName, commissionDate, $);

          if (projectId) {
            commissionData.projectIds.push(projectId);

            // Update beneficiary with commission reference
            const project = data.projects.get(projectId);
            if (project && project.beneficiaryId) {
              linkCommissionToBeneficiary(commissionId, project.beneficiaryId);
            }
          }
        } else {
          // Process each block (new format with multiple projects in one <p>)
          projectBlocks.forEach(block => {
            // Only process blocks that have a <strong> or <b> tag (project name)
            if (block.includes('<strong>') || block.includes('<b>')) {
              const projectId = parseProject(block, currentCategory, commissionId, aidName, commissionDate, $);

              if (projectId) {
                commissionData.projectIds.push(projectId);

                // Update beneficiary with commission reference
                const project = data.projects.get(projectId);
                if (project && project.beneficiaryId) {
                  linkCommissionToBeneficiary(commissionId, project.beneficiaryId);
                }
              }
            }
          });
        }
      }
    });
  });

  // Warn if no projects were found
  if (commissionData.projectIds.length === 0) {
    const urlInfo = url ? `\n     URL: ${url}` : '';
    console.warn(`⚠️  No projects found in commission${urlInfo}`);
  }

  // Store commission in the Map
  data.commissions.set(commissionId, commissionData);

  return commissionData;
}

/**
 * Parse a single project from HTML text and return its ID
 */
export function parseProject(htmlText, category, commissionId, aidName, commissionDate, $) {
  const $temp = $('<div>').html(htmlText);
  const text = $temp.text();

  // Create context for warnings
  const commission = data.commissions.get(commissionId);
  const context = `Commission ${commission?.date || 'unknown date'} - ${aidName}`;

  // Use modular extraction functions with fallback strategies
  const name = extractProjectName($temp, context);
  if (!name) return null; // Skip if no project name

  const beneficiaryName = extractProjectBeneficiary(text, `${context} - Project: ${name}`);
  const talentName = extractProjectTalent(text, `${context} - Project: ${name}`);
  const amount = extractProjectAmount(text, `${context} - Project: ${name}`);

  // Extract description (everything between name and talent, excluding the project name)
  let description = '';
  const lines = text.split(/\n|<br>/);
  if (lines.length > 0) {
    const firstLine = lines[0];
    const descMatch = firstLine.replace(name, '').trim();
    if (descMatch && descMatch.startsWith('–')) {
      description = descMatch.substring(1).trim();
    }
  }

  // Determine project category
  let projectCategory = category || '';
  if (text.includes('aide au pilote')) {
    projectCategory = category ? `${category} - Aide au pilote` : 'Aide au pilote';
  } else if (text.includes('bourse d\'encouragement')) {
    projectCategory = category ? `${category} - Bourse d'encouragement` : 'Bourse d\'encouragement';
  }

  // Create or get beneficiary and talents with deduplication
  const beneficiaryId = getOrCreateBeneficiary(beneficiaryName);

  // Parse multiple talents (split by comma or "et")
  const talentNames = splitTalentNames(talentName);
  const talentIds = talentNames.map(name => getOrCreateTalent(name)).filter(Boolean);

  // Generate deterministic project ID
  const projectId = generateProjectId(aidName, name, commissionDate);

  // Create project object with IDs
  const project = {
    id: projectId,
    name,
    description,
    beneficiaryId,
    talentIds,  // Array of talent IDs instead of single talentId
    amount,
    category: projectCategory,
    commissionId
  };

  // Store project
  data.projects.set(projectId, project);

  // Update beneficiary's project list
  linkProjectToBeneficiary(projectId, beneficiaryId);

  // Update each talent's project list
  talentIds.forEach(talentId => {
    linkProjectToTalent(projectId, talentId);
  });

  return projectId;
}

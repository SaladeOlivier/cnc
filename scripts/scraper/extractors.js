import { parseFrenchDate } from './utils.js';

/**
 * Extract commission date from page with multiple fallback strategies
 * Returns ISO date string (YYYY-MM-DD) or null
 */
export function extractCommissionDate($, url = null) {
  const strategies = [
    // Strategy 1: From <p class="inline"> tag (most common)
    () => {
      const dateText = $('p.inline').first().text().trim();
      if (dateText) return parseFrenchDate(dateText);
      return null;
    },

    // Strategy 2: From any <p> tag containing a date pattern
    () => {
      const datePattern = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
      let foundDate = null;

      $('p').each((_i, el) => {
        const text = $(el).text().trim();
        if (datePattern.test(text)) {
          foundDate = parseFrenchDate(text.match(datePattern)[0]);
          return false; // Break loop
        }
      });

      return foundDate;
    },

    // Strategy 3: From page title
    () => {
      const title = $('h1, .page-title').first().text();
      const datePattern = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
      const match = title.match(datePattern);
      if (match) return parseFrenchDate(match[0]);
      return null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result) {
        return result;
      }
    } catch (err) {
      // Strategy failed, try next one
      continue;
    }
  }

  const urlInfo = url ? `\n     URL: ${url}` : '';
  console.warn(`⚠️  Could not extract commission date${urlInfo}`);
  return null;
}

/**
 * Extract commission members (president and members) with fallback strategies
 * Returns { presidentId: string|null, memberIds: string[], extractMember: function }
 * The extractMember function should be called for each member found
 */
export function extractCommissionMembers($, onMemberFound, url = null) {
  const presidentTitles = [
    'president',
    'presidente',
    'président',
    'présidente',
    'president suppleant',
    'presidente suppleante',
    'président suppléant',
    'présidente suppléante'
  ];

  let presidentId = null;
  const memberIds = [];

  const strategies = [
    // Strategy 1: From "Membres présents" section with <ul><li> structure
    () => {
      const membersSection = $('.clearfix:contains("Membres présents")');
      if (membersSection.length === 0) return false;

      membersSection.find('ul li').each((_i, li) => {
        let memberText = $(li).text().trim();
        const memberTextLower = memberText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Check if any president title is in the text
        let isPresident = false;
        for (const title of presidentTitles) {
          const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (memberTextLower.includes(normalizedTitle)) {
            isPresident = true;
            // Remove the title from the member text
            const regex = new RegExp(`\\(?${title}\\)?`, 'gi');
            memberText = memberText.replace(regex, '').trim();
            break;
          }
        }

        const talentId = onMemberFound(memberText);
        if (talentId) {
          if (isPresident) {
            presidentId = talentId;
          } else {
            memberIds.push(talentId);
          }
        }
      });

      return presidentId !== null || memberIds.length > 0;
    },

    // Strategy 2: From paragraph text with "Président :" and "Membres :" labels
    () => {
      const allText = $('.clearfix, .content, .main-content').text();

      // Extract president
      const presidentMatch = allText.match(/Président[e]?\s*[:：]\s*([^\n,]+)/i);
      if (presidentMatch) {
        presidentId = onMemberFound(presidentMatch[1].trim());
      }

      // Extract members
      const membersMatch = allText.match(/Membres\s*[:：]\s*([^\n]+)/i);
      if (membersMatch) {
        const membersText = membersMatch[1];
        const names = membersText.split(/[,;]/).map(n => n.trim()).filter(n => n.length > 0);

        names.forEach(name => {
          const talentId = onMemberFound(name);
          if (talentId) {
            memberIds.push(talentId);
          }
        });
      }

      return presidentId !== null || memberIds.length > 0;
    }
  ];

  for (const strategy of strategies) {
    try {
      if (strategy()) {
        break; // Success, stop trying strategies
      }
    } catch (err) {
      console.warn('⚠️  Member extraction strategy failed:', err.message);
      continue;
    }
  }

  if (!presidentId && memberIds.length === 0) {
    const urlInfo = url ? `\n     URL: ${url}` : '';
    console.warn(`⚠️  Could not extract commission members${urlInfo}`);
  } else if (!presidentId) {
    const urlInfo = url ? `\n     URL: ${url}` : '';
    console.warn(`⚠️  Could not extract commission president (found ${memberIds.length} members)${urlInfo}`);
  }

  return { presidentId, memberIds };
}

/**
 * Extract project name with fallback strategies
 */
export function extractProjectName($temp, context = null) {
  // Patterns that indicate this is NOT a project (commission headers, etc.)
  const nonProjectPatterns = [
    /membres?\s+présents?\s+(à|a)\s+la\s+commission/i,
    /composition\s+de\s+la\s+commission/i,
    /commission\s+(réunie|spéciale)/i,
    /^résultats?\s+commission/i,
    /liste\s+des\s+membres/i,
    /president\s+(de\s+)?la\s+commission/i
  ];

  const strategies = [
    // Strategy 1: First <strong> tag
    () => $temp.find('strong').first().text().trim(),

    // Strategy 2: First <b> tag
    () => $temp.find('b').first().text().trim(),

    // Strategy 3: First bold text via CSS
    () => $temp.find('[style*="font-weight: bold"]').first().text().trim(),

    // Strategy 4: First line of text (fallback)
    () => {
      const text = $temp.text().trim();
      const firstLine = text.split(/\n/)[0];
      return firstLine.substring(0, 100); // Limit length
    }
  ];

  for (const strategy of strategies) {
    try {
      const name = strategy();
      if (name) {
        // Filter out non-project headers
        const isNonProject = nonProjectPatterns.some(pattern => pattern.test(name));
        if (isNonProject) {
          continue; // Skip this, try next strategy
        }

        // Clean up trailing dash
        return name.replace(/–$/, '').trim();
      }
    } catch (err) {
      continue;
    }
  }

  const contextInfo = context ? `\n     Context: ${context}` : '';
  console.warn(`⚠️  Could not extract project name${contextInfo}`);
  return null;
}

/**
 * Extract project beneficiary with fallback strategies
 */
export function extractProjectBeneficiary(text, context = null) {
  const strategies = [
    // Strategy 1: Standard "Bénéficiaire :" pattern (handles &nbsp; and regular spaces)
    () => {
      const match = text.match(/Bénéficiaire[\s\u00A0]*[:：]?[\s\u00A0]*([^\n]+?)(?:\n|$|<br|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 2: "Beneficiaire" without accent
    () => {
      const match = text.match(/Beneficiaire[\s\u00A0]*[:：]?[\s\u00A0]*([^\n]+?)(?:\n|$|<br|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 3: "Bénéficaire" with typo...
    () => {
      const match = text.match(/Bénéficaire[\s\u00A0]*[:：]?[\s\u00A0]*([^\n]+?)(?:\n|$|<br|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 4: "Demandeur :" alternative label
    () => {
      const match = text.match(/Demandeur[\s\u00A0]*[:：]?[\s\u00A0]*([^\n]+?)(?:\n|$|<br|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 5: "Société :" or "Entreprise :"
    () => {
      const match = text.match(/(?:Société|Entreprise)[\s\u00A0]*[:：]?[\s\u00A0]*([^\n]+?)(?:\n|$|<br|Aide)/i);
      return match ? match[1].trim() : null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result) return result;
    } catch (err) {
      continue;
    }
  }

  const contextInfo = context ? `\n     Context: ${context}` : '';
  console.warn(`⚠️  Could not extract project beneficiary${contextInfo}`);
  return '';
}

/**
 * Extract project talent(s) with fallback strategies
 */
export function extractProjectTalent(text, context = null) {
  const strategies = [
    // Strategy 1: Standard "Talent :" pattern (handles &nbsp; and regular spaces)
    () => {
      const match = text.match(/Talent[\s\u00A0]*[:：][\s\u00A0]*([^\n]+?)(?:\n|$|<br|Bénéficiaire|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 2: "Auteur :" pattern
    () => {
      const match = text.match(/Auteur[\s\u00A0]*[:：][\s\u00A0]*([^\n]+?)(?:\n|$|<br|Bénéficiaire|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 3: "Réalisateur :" pattern
    () => {
      const match = text.match(/Réalisateur[\s\u00A0]*[:：][\s\u00A0]*([^\n]+?)(?:\n|$|<br|Bénéficiaire|Aide)/i);
      return match ? match[1].trim() : null;
    },

    // Strategy 4: "Créateur :" pattern
    () => {
      const match = text.match(/Créateur[\s\u00A0]*[:：][\s\u00A0]*([^\n]+?)(?:\n|$|<br|Bénéficiaire|Aide)/i);
      return match ? match[1].trim() : null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result) return result;
    } catch (err) {
      continue;
    }
  }

  // Note: Not warning for missing talent as it's often optional
  return '';
}

/**
 * Extract project amount with fallback strategies
 */
export function extractProjectAmount(text, context = null) {
  const strategies = [
    // Strategy 1: "Aide accordée : X €" (handles &nbsp; and regular spaces)
    () => {
      const match = text.match(/Aide accordée[\s\u00A0]*[:：][\s\u00A0]*(?::)?[\s\u00A0]*([\d\s\u00A0]+)[\s\u00A0]*€/i);
      if (match) {
        const amountStr = match[1].replace(/[\s\u00A0]/g, '');
        return parseInt(amountStr, 10);
      }
      return null;
    },

    // Strategy 2: "Montant : X €"
    () => {
      const match = text.match(/Montant\s*[:：]\s*([\d\s]+)\s*€/i);
      if (match) {
        const amountStr = match[1].replace(/\s/g, '').replace(/&nbsp;/g, '');
        return parseInt(amountStr, 10);
      }
      return null;
    },

    // Strategy 3: "X € accordé"
    () => {
      const match = text.match(/([\d\s]+)\s*€\s*accordé/i);
      if (match) {
        const amountStr = match[1].replace(/\s/g, '').replace(/&nbsp;/g, '');
        return parseInt(amountStr, 10);
      }
      return null;
    },

    // Strategy 4: Any number followed by €
    () => {
      const match = text.match(/([\d\s]+)\s*€/);
      if (match) {
        const amountStr = match[1].replace(/\s/g, '').replace(/&nbsp;/g, '');
        const amount = parseInt(amountStr, 10);
        // Sanity check: amount should be reasonable (between 100 and 1,000,000)
        if (amount >= 100 && amount <= 1000000) {
          return amount;
        }
      }
      return null;
    }
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy();
      if (result !== null && !isNaN(result)) return result;
    } catch (err) {
      continue;
    }
  }

  const contextInfo = context ? `\n     Context: ${context}` : '';
  console.warn(`⚠️  Could not extract project amount${contextInfo}`);
  return null;
}

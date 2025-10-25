import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

const SEARCH_URL = 'https://www.cnc.fr/professionnels/aides-et-financements/resultats-commissions';

/**
 * Fetch and list all available aid types from CNC
 */
async function listAids() {
  console.log('Fetching all available aid types from CNC...\n');

  try {
    const response = await fetch(SEARCH_URL);
    const html = await response.text();

    const aids = [];

    // Extract the specific select element for aid names (nomAide)
    // Then extract option values from it
    const selectRegex = /<select[^>]*id="_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_nomAide"[^>]*>([\s\S]*?)<\/select>/;
    const selectMatch = html.match(selectRegex);

    if (selectMatch) {
      const selectContent = selectMatch[1];

      // Extract option values from the select content
      const optionRegex = /<option[^>]+value="([^"]+)"[^>]*>/g;
      let match;

      while ((match = optionRegex.exec(selectContent)) !== null) {
        const value = match[1].trim();

        // Filter out empty values, "Sélectionnez" and numeric years
        if (value &&
            !value.toLowerCase().includes('sélectionnez') &&
            value.length > 2 &&
            !/^\d{4}$/.test(value)) { // Exclude 4-digit years
          aids.push(value);
        }
      }
    }

    // Remove duplicates and sort
    const uniqueAids = [...new Set(aids)].sort();

    console.log(`Found ${uniqueAids.length} aid types:\n`);
    uniqueAids.forEach((aid, index) => {
      console.log(`${(index + 1).toString().padStart(3, ' ')}. ${aid}`);
    });

    // Save to file
    const output = {
      fetchedAt: new Date().toISOString(),
      totalAids: uniqueAids.length,
      aids: uniqueAids
    };

    writeFileSync('data/available-aids.json', JSON.stringify(output, null, 2));
    console.log(`\n✓ Saved to available-aids.json`);

    return uniqueAids;
  } catch (error) {
    console.error('Error fetching aid types:', error.message);
    return [];
  }
}

// Run if executed directly
listAids().catch(console.error);

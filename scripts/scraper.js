#!/usr/bin/env node

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import { delay } from './scraper/utils.js';
import { parseCommissionPage } from './scraper/parsers.js';
import { loadExistingData, cleanupOrphanedEntities, mergeWithPreservedData } from './scraper/data-manager.js';
import { savePerAidSourceFiles, saveMainDataFile } from './scraper/file-operations.js';

const BASE_URL = 'https://www.cnc.fr';
const SEARCH_URL = `${BASE_URL}/professionnels/aides-et-financements/resultats-commissions`;

/**
 * Fetch all commission result pages for a specific aid
 */
async function fetchCommissionList(aidName, limit) {
  console.log(`Fetching commission list for: ${aidName}`);

  const commissionLinks = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages && (!limit || currentPage <= limit)) {
    // Build URL with all required parameters
    const params = new URLSearchParams({
      'nomAide': aidName,
      '_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_cur': currentPage,
      'p_p_id': 'CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM',
      '_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_secteur': '',
      '_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_annee': '',
      '_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_nomAide': ''
    });

    const url = `${SEARCH_URL}?${params.toString()}`;
    console.log(`Fetching page ${currentPage}...`);
    console.log(`URL: ${url}`);

    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Find all commission result links from the table
    let foundOnThisPage = 0;
    $('table.table-striped tbody tr').each((_i, row) => {
      const $row = $(row);
      const link = $row.find('a[href*="resultats-de-la-commission"]').first();

      if (link.length > 0) {
        const href = link.attr('href');
        if (href) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          if (!commissionLinks.includes(fullUrl)) {
            commissionLinks.push(fullUrl);
            foundOnThisPage++;
          }
        }
      }
    });

    console.log(`Found ${foundOnThisPage} commissions on page ${currentPage}`);

    // Check if there's a next page
    const nextPageLink = $('a.next, a[rel="next"]').length > 0;

    // If we found no results on this page or no pagination, stop
    if (foundOnThisPage === 0 || (!nextPageLink && currentPage > 1)) {
      hasMorePages = false;
    } else {
      currentPage++;
      await delay(1000); // Rate limiting between page requests
    }

    // Safety limit to avoid infinite loops
    if (currentPage > 100) {
      console.log('Reached page limit, stopping...');
      hasMorePages = false;
    }
  }

  console.log(`Found ${commissionLinks.length} total commission pages`);
  return commissionLinks;
}

/**
 * Fetch all available aid names from the search page
 */
async function fetchAllAidNames() {
  console.log('Fetching list of all available aids...');

  try {
    const response = await fetch(SEARCH_URL);
    const html = await response.text();
    const $ = cheerio.load(html);

    const aidNames = [];

    // Extract aid names from the specific nomAide select element only
    $('#_CncPortletRechercheResultatsCommissions_INSTANCE_xLSVbj1jyJkM_nomAide option').each((_i, option) => {
      const value = $(option).attr('value');
      // Filter out empty values, "Sélectionnez" and numeric years
      if (value &&
          value !== '' &&
          !value.toLowerCase().includes('sélectionnez') &&
          !/^\d{4}$/.test(value)) { // Exclude 4-digit years
        aidNames.push(value.trim());
      }
    });

    // Remove duplicates and sort
    const uniqueAids = [...new Set(aidNames)].sort();
    console.log(`Found ${uniqueAids.length} aid types`);

    return uniqueAids;
  } catch (error) {
    console.error('Error fetching aid names:', error.message);
    return [];
  }
}

/**
 * Main scraping function
 */
async function scrape() {
  console.log('Starting CNC data scraping...');

  // Get target aids from command line args or use default
  const args = process.argv.slice(2);
  let targetAids = [];
  let limitCommissions = null; // null = no limit

  // Check for --limit flag
  if (args.includes('--limit')) {
    const limitIndex = args.indexOf('--limit');
    if (args[limitIndex + 1]) {
      limitCommissions = parseInt(args[limitIndex + 1], 10);
      if (isNaN(limitCommissions) || limitCommissions < 1) {
        console.error('--limit must be a positive number');
        process.exit(1);
      }
      console.log(`⚠️  TEST MODE: Limiting to ${limitCommissions} commission(s) per aid\n`);
    } else {
      console.error('No number specified after --limit flag');
      process.exit(1);
    }
  }

  if (args.includes('--all')) {
    // Scrape all available aids
    console.log('Fetching all available aid types...');
    targetAids = await fetchAllAidNames();
    if (targetAids.length === 0) {
      console.error('Could not fetch aid names. Using default.');
      targetAids = ["Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)"];
    }
  } else if (args.includes('--aid')) {
    // Use specified aid
    const aidIndex = args.indexOf('--aid');
    if (args[aidIndex + 1] && !args[aidIndex + 1].startsWith('--')) {
      targetAids = [args[aidIndex + 1]];
    } else {
      console.error('No aid name specified after --aid flag');
      process.exit(1);
    }
  } else if (args.includes('--aids')) {
    // Use multiple specified aids (comma-separated)
    const aidsIndex = args.indexOf('--aids');
    if (args[aidsIndex + 1] && !args[aidsIndex + 1].startsWith('--')) {
      targetAids = args[aidsIndex + 1].split(',').map(a => a.trim());
    } else {
      console.error('No aid names specified after --aids flag');
      process.exit(1);
    }
  } else {
    // Default: CNC Talent
    targetAids = ["Fonds d'aide aux créateurs vidéo sur Internet (CNC Talent)"];
  }

  console.log(`\nScraping ${targetAids.length} aid type(s):\n${targetAids.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}\n`);

  try {
    // Load existing data for partial update (preserves data from other aids)
    const preservedData = loadExistingData(targetAids);

    // Process each aid type
    for (let aidIndex = 0; aidIndex < targetAids.length; aidIndex++) {
      const targetAid = targetAids[aidIndex];
      console.log(`\n[${aidIndex + 1}/${targetAids.length}] Processing: ${targetAid}`);

      // Get all commission pages for this aid
      const commissionUrls = await fetchCommissionList(targetAid, limitCommissions);

      // Apply limit if specified
      const urlsToProcess = limitCommissions
        ? commissionUrls.slice(0, limitCommissions)
        : commissionUrls;

      console.log(`  Processing ${urlsToProcess.length} of ${commissionUrls.length} commission(s)`);

      // Parse each commission (with rate limiting)
      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        console.log(`  [${i + 1}/${urlsToProcess.length}] Parsing commission...`);

        try {
          const response = await fetch(url);
          const html = await response.text();
          const $ = cheerio.load(html);

          // Standard paragraph-based format
          parseCommissionPage(url, targetAid, $);
        } catch (error) {
          console.error(`  ❌ Error parsing ${url}:`, error.message);
          // Continue with next commission
        }

        // Rate limiting: wait 1 second between requests
        if (i < urlsToProcess.length - 1) {
          await delay(1000);
        }
      }

      // Rate limiting between aid types
      if (aidIndex < targetAids.length - 1) {
        await delay(2000);
      }
    }

    // Merge with preserved data from other aids
    mergeWithPreservedData(preservedData);

    // Cleanup orphaned beneficiaries and talents
    console.log('\nCleaning up orphaned entities...');
    cleanupOrphanedEntities();

    // Save per-aid source files
    savePerAidSourceFiles(targetAids);

    // Save main combined data file
    saveMainDataFile(targetAids, preservedData);

  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

// Run the scraper
scrape().catch(console.error);

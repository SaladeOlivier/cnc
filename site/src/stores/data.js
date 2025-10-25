import { writable, derived } from 'svelte/store';

// Raw data from JSON
export const rawData = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Lookup maps for fast ID-based access
export const commissionsMap = writable(new Map());
export const projectsMap = writable(new Map());
export const beneficiariesMap = writable(new Map());
export const talentsMap = writable(new Map());

// Filters
export const searchTerm = writable('');
export const yearFilter = writable('');
export const aidFilter = writable('');
export const sortBy = writable('date-desc');

// Load data from JSON
export async function loadData() {
  loading.set(true);
  error.set(null);

  try {
    const response = await fetch('./cnc-data.json');
    if (!response.ok) throw new Error('Failed to load data');

    const data = await response.json();

    // Create lookup maps for fast access
    const comMap = new Map(data.commissions.map(c => [c.id, c]));
    const projMap = new Map(data.projects.map(p => [p.id, p]));
    const benMap = new Map(data.beneficiaries.map(b => [b.id, b]));
    const talMap = new Map((data.talents || []).map(t => [t.id, t]));

    commissionsMap.set(comMap);
    projectsMap.set(projMap);
    beneficiariesMap.set(benMap);
    talentsMap.set(talMap);

    rawData.set(data);
    loading.set(false);
  } catch (err) {
    console.error('Error loading data:', err);
    error.set(err.message);
    loading.set(false);
  }
}

// Helper functions to resolve ID references
export function resolveProject(projectId, $projectsMap) {
  return $projectsMap.get(projectId);
}

export function resolveBeneficiary(beneficiaryId, $beneficiariesMap) {
  return $beneficiariesMap.get(beneficiaryId);
}

export function resolveTalent(talentId, $talentsMap) {
  return $talentsMap.get(talentId);
}

export function resolveCommission(commissionId, $commissionsMap) {
  return $commissionsMap.get(commissionId);
}

// Denormalized view: Commission with resolved projects
export function denormalizeCommission(commission, $projectsMap, $beneficiariesMap, $talentsMap) {
  return {
    ...commission,
    projects: commission.projectIds.map(id => {
      const project = $projectsMap.get(id);
      if (!project) return null;

      return {
        ...project,
        beneficiary: project.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId)?.name : null,
        talents: project.talentIds ? project.talentIds.map(tid => $talentsMap.get(tid)).filter(Boolean) : []
      };
    }).filter(Boolean)
  };
}

// Denormalized view: Project with resolved references
export function denormalizeProject(project, $beneficiariesMap, $talentsMap, $commissionsMap) {
  return {
    ...project,
    beneficiary: project.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId)?.name : null,
    talents: project.talentIds ? project.talentIds.map(id => $talentsMap.get(id)).filter(Boolean) : [],
    commission: project.commissionId ? $commissionsMap.get(project.commissionId) : null
  };
}

// Derived stores for filtered data
export const filteredCommissions = derived(
  [rawData, commissionsMap, projectsMap, beneficiariesMap, talentsMap, searchTerm, yearFilter, aidFilter, sortBy],
  ([$rawData, $commissionsMap, $projectsMap, $beneficiariesMap, $talentsMap, $searchTerm, $yearFilter, $aidFilter, $sortBy]) => {
    if (!$rawData || !$rawData.commissions) return [];

    let filtered = [...$rawData.commissions];

    // Apply search filter
    if ($searchTerm) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(c => {
        // Search in commission fields
        if (c.president?.toLowerCase().includes(term)) return true;
        if (c.members?.some(m => m.toLowerCase().includes(term))) return true;
        if (c.aidName?.toLowerCase().includes(term)) return true;

        // Search in related projects
        return c.projectIds?.some(projId => {
          const project = $projectsMap.get(projId);
          if (!project) return false;

          if (project.name?.toLowerCase().includes(term)) return true;

          const beneficiary = project.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId) : null;
          if (beneficiary?.name?.toLowerCase().includes(term)) return true;

          // Search in all talents for this project
          if (project.talentIds) {
            const talents = project.talentIds.map(tid => $talentsMap.get(tid)).filter(Boolean);
            if (talents.some(t => t?.name?.toLowerCase().includes(term))) return true;
          }

          return false;
        });
      });
    }

    // Apply year filter
    if ($yearFilter) {
      filtered = filtered.filter(c => {
        if (!c.date) return false;
        const year = new Date(c.date).getFullYear();
        return year === parseInt($yearFilter);
      });
    }

    // Apply aid filter
    if ($aidFilter) {
      filtered = filtered.filter(c => c.aidName === $aidFilter);
    }

    // Apply sorting
    filtered.sort(getSortFunctionForCommissions($sortBy, $projectsMap));

    return filtered;
  }
);

export const filteredProjects = derived(
  [rawData, projectsMap, beneficiariesMap, talentsMap, commissionsMap, searchTerm, sortBy],
  ([$rawData, $projectsMap, $beneficiariesMap, $talentsMap, $commissionsMap, $searchTerm, $sortBy]) => {
    if (!$rawData || !$rawData.projects) return [];

    let filtered = [...$rawData.projects];

    // Apply search filter
    if ($searchTerm) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(p => {
        if (p.name?.toLowerCase().includes(term)) return true;
        if (p.description?.toLowerCase().includes(term)) return true;

        const beneficiary = p.beneficiaryId ? $beneficiariesMap.get(p.beneficiaryId) : null;
        if (beneficiary?.name?.toLowerCase().includes(term)) return true;

        // Search in all talents for this project
        if (p.talentIds) {
          const talents = p.talentIds.map(tid => $talentsMap.get(tid)).filter(Boolean);
          if (talents.some(t => t?.name?.toLowerCase().includes(term))) return true;
        }

        return false;
      });
    }

    // Apply sorting
    filtered.sort(getSortFunctionForProjects($sortBy));

    // Denormalize projects for display
    return filtered.map(p => denormalizeProject(p, $beneficiariesMap, $talentsMap, $commissionsMap));
  }
);

export const filteredBeneficiaries = derived(
  [rawData, beneficiariesMap, projectsMap, searchTerm, sortBy],
  ([$rawData, $beneficiariesMap, $projectsMap, $searchTerm, $sortBy]) => {
    if (!$rawData || !$rawData.beneficiaries) return [];

    let filtered = [...$rawData.beneficiaries];

    // Apply search filter
    if ($searchTerm) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        if (b.name?.toLowerCase().includes(term)) return true;

        // Search in related projects
        return b.projectIds?.some(projId => {
          const project = $projectsMap.get(projId);
          return project?.name?.toLowerCase().includes(term);
        });
      });
    }

    // Apply sorting
    filtered.sort(getSortFunctionForBeneficiaries($sortBy, $projectsMap));

    return filtered;
  }
);

// Helper to get unique years and aids for filters
export const filterOptions = derived(rawData, ($rawData) => {
  if (!$rawData || !$rawData.commissions) return { years: [], aids: [] };

  const years = new Set();
  const aids = new Set();

  $rawData.commissions.forEach(c => {
    if (c.date) {
      const year = new Date(c.date).getFullYear();
      years.add(year);
    }
    if (c.aidName) {
      aids.add(c.aidName);
    }
  });

  return {
    years: Array.from(years).sort((a, b) => b - a),
    aids: Array.from(aids).sort()
  };
});

// Statistics
export const stats = derived(
  [rawData, projectsMap, beneficiariesMap, commissionsMap, talentsMap],
  ([$rawData, $projectsMap, $beneficiariesMap, $commissionsMap, $talentsMap]) => {
    if (!$rawData) return null;

    const totalAmount = $rawData.projects.reduce((sum, p) => sum + (p.amount || 0), 0);
    const avgAmount = $rawData.projects.length > 0 ? totalAmount / $rawData.projects.length : 0;

    // Top beneficiaries by total funding amount
    const topBeneficiaries = [...$rawData.beneficiaries]
      .map(b => ({
        id: b.id,
        name: b.name,
        count: b.projectIds?.length || 0,
        totalFunding: (b.projectIds || []).reduce((sum, projId) => {
          const project = $projectsMap.get(projId);
          return sum + (project?.amount || 0);
        }, 0)
      }))
      .filter(b => b.totalFunding > 0)
      .sort((a, b) => b.totalFunding - a.totalFunding)
      .slice(0, 10);

    // Top talents by total funding
    const topTalents = [...$rawData.talents]
      .map(t => ({
        id: t.id,
        name: t.name,
        projectCount: t.projectIds?.length || 0,
        totalFunding: (t.projectIds || []).reduce((sum, projId) => {
          const project = $projectsMap.get(projId);
          return sum + (project?.amount || 0);
        }, 0)
      }))
      .filter(t => t.totalFunding > 0)
      .sort((a, b) => b.totalFunding - a.totalFunding)
      .slice(0, 10);

    // Funding evolution over time (by commission date)
    const fundingByDate = {};
    $rawData.commissions.forEach(commission => {
      if (!commission.date) return;

      const totalFunding = (commission.projectIds || []).reduce((sum, projId) => {
        const project = $projectsMap.get(projId);
        return sum + (project?.amount || 0);
      }, 0);

      if (totalFunding > 0) {
        fundingByDate[commission.date] = (fundingByDate[commission.date] || 0) + totalFunding;
      }
    });

    // Convert to array and sort by date
    const fundingEvolution = Object.entries(fundingByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      totalCommissions: $rawData.commissions?.length || 0,
      totalProjects: $rawData.projects?.length || 0,
      totalBeneficiaries: $rawData.beneficiaries?.length || 0,
      totalTalents: $rawData.talents?.length || 0,
      totalAmount,
      avgAmount,
      topBeneficiaries,
      topTalents,
      fundingEvolution
    };
  }
);

// Sort helper function
// Helper function to calculate total amount from project IDs
function calculateTotalAmount(projectIds, projectsMap) {
  return projectIds?.reduce((sum, projectId) => {
    const project = projectsMap.get(projectId);
    return sum + (project?.amount || 0);
  }, 0) || 0;
}

// Sort function for projects (simple amount field)
function getSortFunctionForProjects(sortBy) {
  switch (sortBy) {
    case 'date-desc':
      return (a, b) => new Date(b.date || 0) - new Date(a.date || 0);
    case 'date-asc':
      return (a, b) => new Date(a.date || 0) - new Date(b.date || 0);
    case 'amount-desc':
      return (a, b) => (b.amount || 0) - (a.amount || 0);
    case 'amount-asc':
      return (a, b) => (a.amount || 0) - (b.amount || 0);
    case 'name':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    default:
      return () => 0;
  }
}

// Sort function for commissions (needs to calculate total from projects)
function getSortFunctionForCommissions(sortBy, projectsMap) {
  switch (sortBy) {
    case 'date-desc':
      return (a, b) => new Date(b.date || 0) - new Date(a.date || 0);
    case 'date-asc':
      return (a, b) => new Date(a.date || 0) - new Date(b.date || 0);
    case 'amount-desc':
      return (a, b) => {
        const totalA = calculateTotalAmount(a.projectIds, projectsMap);
        const totalB = calculateTotalAmount(b.projectIds, projectsMap);
        return totalB - totalA;
      };
    case 'amount-asc':
      return (a, b) => {
        const totalA = calculateTotalAmount(a.projectIds, projectsMap);
        const totalB = calculateTotalAmount(b.projectIds, projectsMap);
        return totalA - totalB;
      };
    case 'name':
      return (a, b) => (a.aidName || '').localeCompare(b.aidName || '');
    default:
      return () => 0;
  }
}

// Sort function for beneficiaries (needs to calculate total from projects)
function getSortFunctionForBeneficiaries(sortBy, projectsMap) {
  switch (sortBy) {
    case 'date-desc':
    case 'date-asc':
      // Beneficiaries don't have dates, so we'll sort by name instead
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    case 'amount-desc':
      return (a, b) => {
        const totalA = calculateTotalAmount(a.projectIds, projectsMap);
        const totalB = calculateTotalAmount(b.projectIds, projectsMap);
        return totalB - totalA;
      };
    case 'amount-asc':
      return (a, b) => {
        const totalA = calculateTotalAmount(a.projectIds, projectsMap);
        const totalB = calculateTotalAmount(b.projectIds, projectsMap);
        return totalA - totalB;
      };
    case 'name':
      return (a, b) => (a.name || '').localeCompare(b.name || '');
    default:
      return () => 0;
  }
}

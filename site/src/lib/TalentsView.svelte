<script>
  import { rawData, talentsMap, projectsMap } from '../stores/data.js';
  import { searchTerm, sortBy } from '../stores/data.js';
  import { link } from 'svelte-spa-router';
  import { derived } from 'svelte/store';

  function formatAmount(amount) {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function calculateTotalAmount(talent, $projectsMap) {
    return talent.projectIds?.reduce((sum, projectId) => {
      const project = $projectsMap.get(projectId);
      return sum + (project?.amount || 0);
    }, 0) || 0;
  }

  // Create a derived store for filtered talents
  const filteredTalents = derived(
    [rawData, talentsMap, projectsMap, searchTerm, sortBy],
    ([$rawData, $talentsMap, $projectsMap, $searchTerm, $sortBy]) => {
      if (!$rawData || !$rawData.talents) return [];

      let filtered = [...$rawData.talents];

      // Apply search filter
      if ($searchTerm) {
        const term = $searchTerm.toLowerCase();
        filtered = filtered.filter(t => {
          if (t.name?.toLowerCase().includes(term)) return true;

          // Search in related projects
          return t.projectIds?.some(projId => {
            const project = $projectsMap.get(projId);
            return project?.name?.toLowerCase().includes(term);
          });
        });
      }

      // Apply sorting
      if ($sortBy === 'name') {
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      } else if ($sortBy === 'amount-desc') {
        filtered.sort((a, b) => {
          const totalA = calculateTotalAmount(a, $projectsMap);
          const totalB = calculateTotalAmount(b, $projectsMap);
          return totalB - totalA;
        });
      } else if ($sortBy === 'amount-asc') {
        filtered.sort((a, b) => {
          const totalA = calculateTotalAmount(a, $projectsMap);
          const totalB = calculateTotalAmount(b, $projectsMap);
          return totalA - totalB;
        });
      } else {
        // Default: sort by number of projects
        filtered.sort((a, b) => (b.projectIds?.length || 0) - (a.projectIds?.length || 0));
      }

      return filtered;
    }
  );
</script>

<div class="view-header">
  <h2>Talents</h2>
  <span class="count">{$filteredTalents.length} talent{$filteredTalents.length !== 1 ? 's' : ''}</span>
</div>

<div class="results-list">
  {#if $filteredTalents.length === 0}
    <p class="empty-state">Pas de talent trouvé</p>
  {:else}
    {#each $filteredTalents as talent (talent.id)}
      {@const totalAmount = calculateTotalAmount(talent, $projectsMap)}
      <a href="/talent/{talent.id}" use:link class="card">
        <h3>{talent.name}</h3>
        <div class="meta">
          <div class="meta-item">
            <span class="badge">{talent.projectIds?.length || 0} projet{talent.projectIds?.length !== 1 ? 's' : ''}</span>
          </div>
          {#if totalAmount > 0}
            <div class="meta-item amount">{formatAmount(totalAmount)}</div>
          {/if}
        </div>
      </a>
    {/each}
  {/if}
</div>

<style>
  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  h2 {
    color: #0047ab;
    font-size: 1.8rem;
  }

  .count {
    background: #0047ab;
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .results-list {
    display: grid;
    gap: 15px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #6c757d;
    background: white;
    border-radius: 8px;
  }

  .card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;
    border-left: 4px solid #0047ab;
    text-decoration: none;
    color: inherit;
    display: block;
  }

  .card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  h3 {
    color: #0047ab;
    margin-bottom: 10px;
    font-size: 1.3rem;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    color: #6c757d;
    font-size: 0.9rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .amount {
    color: #ff6b6b;
    font-weight: 600;
    font-size: 1.1rem;
  }
</style>

<script>
  import { filteredCommissions } from '../stores/data.js';
  import CommissionCard from './CommissionCard.svelte';
</script>

<div class="view-header">
  <h2>Commissions</h2>
  <span class="count">{$filteredCommissions.length} commission{$filteredCommissions.length !== 1 ? 's' : ''}</span>
</div>

<div class="results-list">
  {#if $filteredCommissions.length === 0}
    <p class="empty-state">Pas de commission trouvée</p>
  {:else}
    {#each $filteredCommissions as commission (commission.id)}
      <CommissionCard {commission} />
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

  @media (max-width: 768px) {
    .view-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    h2 {
      font-size: 1.5rem;
    }
  }
</style>

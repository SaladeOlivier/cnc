<script>
  import { createEventDispatcher } from 'svelte';

  export let currentView = 'commissions';

  const dispatch = createEventDispatcher();

  const tabs = [
    { id: 'commissions', label: 'Commissions' },
    { id: 'projects', label: 'Projets' },
    { id: 'beneficiaries', label: 'Bénéficiaires' },
    { id: 'talents', label: 'Talents' },
    { id: 'stats', label: 'Statistiques' }
  ];

  function handleTabClick(tabId) {
    dispatch('viewChange', tabId);
  }
</script>

<nav class="tabs">
  {#each tabs as tab}
    <button
      class="tab"
      class:active={currentView === tab.id}
      on:click={() => handleTabClick(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .tab {
    flex: 1;
    padding: 12px 20px;
    background: transparent;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  .tab:hover {
    background: #f8f9fa;
    border-color: #0047ab;
  }

  .tab.active {
    background: #0047ab;
    color: white;
    border-color: #0047ab;
  }

  @media (max-width: 768px) {
    .tabs {
      flex-direction: column;
    }
  }
</style>

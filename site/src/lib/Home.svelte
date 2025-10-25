<script>
  import Tabs from './Tabs.svelte';
  import SearchFilters from './SearchFilters.svelte';
  import CommissionsView from './CommissionsView.svelte';
  import ProjectsView from './ProjectsView.svelte';
  import BeneficiariesView from './BeneficiariesView.svelte';
  import TalentsView from './TalentsView.svelte';
  import StatsView from './StatsView.svelte';

  let currentView = 'commissions';

  function switchView(view) {
    currentView = view;
  }
</script>

<Tabs {currentView} on:viewChange={(e) => switchView(e.detail)} />

<SearchFilters />

<div class="views">
  {#if currentView === 'commissions'}
    <CommissionsView />
  {:else if currentView === 'projects'}
    <ProjectsView />
  {:else if currentView === 'beneficiaries'}
    <BeneficiariesView />
  {:else if currentView === 'talents'}
    <TalentsView />
  {:else if currentView === 'stats'}
    <StatsView />
  {/if}
</div>

<style>
  .views {
    margin-top: 20px;
  }
</style>

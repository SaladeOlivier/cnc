<script>
  import { onMount } from 'svelte';
  import Router from 'svelte-spa-router';
  import { loadData, loading, error } from './stores/data.js';
  import Header from './lib/Header.svelte';
  import Home from './lib/Home.svelte';
  import CommissionDetail from './lib/CommissionDetail.svelte';
  import ProjectDetail from './lib/ProjectDetail.svelte';
  import BeneficiaryDetail from './lib/BeneficiaryDetail.svelte';
  import TalentDetail from './lib/TalentDetail.svelte';

  onMount(() => {
    loadData();
  });

  const routes = {
    '/': Home,
    '/commission/:id': CommissionDetail,
    '/project/:id': ProjectDetail,
    '/beneficiary/:id': BeneficiaryDetail,
    '/talent/:id': TalentDetail,
  };
</script>

<div class="app">
  <Header />

  {#if $loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading data...</p>
    </div>
  {:else if $error}
    <div class="error">
      <p>Error loading data: {$error}</p>
    </div>
  {:else}
    <Router {routes} />
  {/if}

  <footer>
    <p>Data source: <a href="https://www.cnc.fr" target="_blank" rel="noopener">CNC.fr</a></p>
    <p><a href="https://github.com/SaladeOlivier/cnc" target="_blank" rel="noopener">View on GitHub</a></p>
  </footer>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #212529;
    background: #f8f9fa;
  }

  .app {
    width: 100%;
    max-width: 1200px;
    min-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }

  @media (max-width: 1240px) {
    .app {
      min-width: auto;
      width: 100%;
      padding: 20px;
    }
  }

  .loading {
    text-align: center;
    padding: 60px 20px;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #dee2e6;
    border-top-color: #0047ab;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error {
    background: #f8d7da;
    color: #721c24;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #f5c6cb;
    text-align: center;
    margin: 20px 0;
  }

  footer {
    text-align: center;
    padding: 30px 20px;
    color: #6c757d;
    font-size: 0.9rem;
    margin-top: 40px;
  }

  footer a {
    color: #0047ab;
    text-decoration: none;
  }

  footer a:hover {
    text-decoration: underline;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import { stats } from '../stores/data.js';
  import { link } from 'svelte-spa-router';
  import {
    Chart,
    LineController,
    BarController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
  } from 'chart.js';

  // Register Chart.js components
  Chart.register(
    LineController,
    BarController,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
  );

  let aggregation = 'all'; // 'all', 'year'
  let chartCanvas: HTMLCanvasElement;
  let chartInstance: Chart | null = null;

  function formatAmount(amount) {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // Aggregate funding data based on selected time period
  $: aggregatedData = $stats ? aggregateFunding($stats.fundingEvolution, aggregation) : [];

  function aggregateFunding(data, agg) {
    if (!data || data.length === 0) return [];

    if (agg === 'all') {
      return data;
    }

    const grouped = {};
    data.forEach(item => {
      const date = new Date(item.date);
      let key;

      if (agg === 'year') {
        key = date.getFullYear().toString();
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, amount: 0 };
      }
      grouped[key].amount += item.amount;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }

  // Format aggregated date for display
  function formatAggregatedDate(dateStr, agg) {
    if (agg === 'year') {
      return dateStr;
    }
    return formatDate(dateStr);
  }

  // Update chart when data or aggregation changes
  $: if (chartCanvas && aggregatedData) {
    updateChart(aggregatedData);
  }

  function updateChart(data) {
    if (chartInstance) {
      chartInstance.destroy();
    }

    if (!chartCanvas || !data || data.length === 0) return;

    const ctx = chartCanvas.getContext('2d');

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => formatAggregatedDate(d.date, aggregation)),
        datasets: [{
          label: 'Financement',
          data: data.map(d => d.amount),
          backgroundColor: 'rgba(0, 71, 171, 0.7)',
          borderColor: 'rgba(0, 71, 171, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return formatAmount(context.parsed.y);
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatAmount(value);
              }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }

  onMount(() => {
    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });
</script>

<div class="view-header">
  <h2>Statistiques</h2>
</div>

{#if $stats}
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Commissions</h3>
      <div class="value">{$stats.totalCommissions}</div>
    </div>

    <div class="stat-card">
      <h3>Projets</h3>
      <div class="value">{$stats.totalProjects}</div>
    </div>

    <div class="stat-card">
      <h3>Bénéficiaires</h3>
      <div class="value">{$stats.totalBeneficiaries}</div>
    </div>

    <div class="stat-card">
      <h3>Financement total</h3>
      <div class="value">{formatAmount($stats.totalAmount)}</div>
    </div>

    <div class="stat-card">
      <h3>Moyenne par projet</h3>
      <div class="value">{formatAmount($stats.avgAmount)}</div>
    </div>

    <div class="stat-card chart-card">
      <div class="chart-header">
        <h3>Évolution du financement</h3>
        <div class="aggregation-buttons">
          <button
            class:active={aggregation === 'all'}
            on:click={() => aggregation = 'all'}
          >
            Tout
          </button>
          <button
            class:active={aggregation === 'year'}
            on:click={() => aggregation = 'year'}
          >
            Par année
          </button>
        </div>
      </div>
      <div class="chart-container">
        {#if aggregatedData.length > 0}
          <canvas bind:this={chartCanvas}></canvas>
        {:else}
          <p class="no-data">Aucune donnée disponible</p>
        {/if}
      </div>
    </div>

    <div class="stat-card top-talents">
      <h3>Top des talents (par financement)</h3>
      <div class="list">
        {#each $stats.topTalents as talent}
          <a href="/talent/{talent.id}" use:link class="list-item clickable">
            <span class="name">{talent.name}</span>
            <div class="stats-inline">
              <span class="badge amount-badge">{formatAmount(talent.totalFunding)}</span>
              <span class="badge">{talent.projectCount} projet{talent.projectCount !== 1 ? 's' : ''}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>

    <div class="stat-card top-beneficiaries">
      <h3>Top des bénéficiaires (par financement)</h3>
      <div class="list">
        {#each $stats.topBeneficiaries as beneficiary}
          <a href="/beneficiary/{beneficiary.id}" use:link class="list-item clickable">
            <span class="name">{beneficiary.name}</span>
            <div class="stats-inline">
              <span class="badge amount-badge">{formatAmount(beneficiary.totalFunding)}</span>
              <span class="badge">{beneficiary.count} projet{beneficiary.count !== 1 ? 's' : ''}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
{/if}

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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .stat-card {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .stat-card h3 {
    color: #6c757d;
    font-size: 0.9rem;
    text-transform: uppercase;
    margin-bottom: 10px;
    font-weight: 500;
  }

  .stat-card .value {
    color: #0047ab;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .chart-card {
    grid-column: 1 / -1;
    text-align: left;
  }

  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .aggregation-buttons {
    display: flex;
    gap: 10px;
  }

  .aggregation-buttons button {
    padding: 8px 16px;
    background: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .aggregation-buttons button:hover {
    background: #e9ecef;
    border-color: #0047ab;
  }

  .aggregation-buttons button.active {
    background: #0047ab;
    color: white;
    border-color: #0047ab;
  }

  .chart-container {
    min-height: 400px;
    position: relative;
    padding: 20px 0;
  }

  .chart-container canvas {
    max-height: 400px;
  }

  .no-data {
    color: #6c757d;
    text-align: center;
  }

  .top-beneficiaries,
  .top-talents {
    grid-column: 1 / -1;
    text-align: left;
  }

  .list {
    margin-top: 15px;
  }

  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #dee2e6;
  }

  .list-item.clickable {
    text-decoration: none;
    color: inherit;
    transition: background 0.2s;
  }

  .list-item.clickable:hover {
    background: #f8f9fa;
  }

  .list-item:last-child {
    border-bottom: none;
  }

  .name {
    font-weight: 500;
    flex: 1;
  }

  .stats-inline {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }

  .badge.amount-badge {
    background: #fff3cd;
    color: #856404;
    font-weight: 600;
  }
</style>

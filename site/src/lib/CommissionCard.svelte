<script>
  import { projectsMap, talentsMap } from '../stores/data.js';
  import { link } from 'svelte-spa-router';

  export let commission;

  function formatDate(dateString) {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatAmount(amount) {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(amount);
  }

  $: totalAmount = commission.projectIds?.reduce((sum, projectId) => {
    const project = $projectsMap.get(projectId);
    return sum + (project?.amount || 0);
  }, 0) || 0;

  // Resolve president and members from IDs
  $: president = commission.presidentId ? $talentsMap.get(commission.presidentId) : null;
  $: members = commission.memberIds?.map(id => $talentsMap.get(id)).filter(Boolean) || [];
</script>

<a href="/commission/{commission.id}" use:link class="card">
  <h3>{formatDate(commission.date)}</h3>
  <div class="meta">
    <div class="meta-item">
      <span class="badge">{commission.projectIds?.length || 0} projet{commission.projectIds?.length !== 1 ? 's' : ''}</span>
    </div>
    {#if totalAmount > 0}
      <div class="meta-item amount">{formatAmount(totalAmount)}</div>
    {/if}
    {#if president}
      <div class="meta-item">Président : {president.name}</div>
    {/if}
  </div>
  {#if commission.aidName}
    <p class="description">{commission.aidName}</p>
  {/if}
  {#if members?.length > 0}
    <p class="description">{members.length} membre{members.length !== 1 ? 's' : ''}</p>
  {/if}
</a>

<style>
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
    margin-bottom: 10px;
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

  .description {
    color: #212529;
    line-height: 1.5;
    margin-top: 10px;
  }
</style>

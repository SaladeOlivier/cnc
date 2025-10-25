<script>
  import { link } from 'svelte-spa-router';

  export let project;

  function formatAmount(amount) {
    if (!amount) return '0 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }
</script>

<a href="/project/{project.id}" use:link class="card">
  <h3>{project.name || 'Projet sans nom'}</h3>
  <div class="meta">
    {#if project.beneficiary}
      <div class="meta-item">Bénéficiaire : {project.beneficiary}</div>
    {/if}
    {#if project.amount}
      <div class="meta-item amount">{formatAmount(project.amount)}</div>
    {/if}
    {#if project.talents && project.talents.length > 0}
      <div class="meta-item">
        {project.talents.length === 1 ? 'Talent' : 'Talents'} : {project.talents.map(t => t.name).join(', ')}
      </div>
    {/if}
  </div>
  {#if project.description}
    <p class="description">{project.description}</p>
  {/if}
  {#if project.category}
    <p class="category"><span class="badge">{project.category}</span></p>
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

  .category {
    margin-top: 10px;
  }

  .badge {
    display: inline-block;
    padding: 4px 10px;
    background: #f8f9fa;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
  }
</style>

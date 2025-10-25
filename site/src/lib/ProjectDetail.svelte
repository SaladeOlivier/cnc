<script>
  import { projectsMap, commissionsMap, beneficiariesMap, talentsMap } from '../stores/data.js';
  import { link } from 'svelte-spa-router';

  export let params = {};

  $: project = $projectsMap.get(params.id);
  $: commission = project?.commissionId ? $commissionsMap.get(project.commissionId) : null;
  $: beneficiary = project?.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId) : null;
  $: talents = project?.talentIds ? project.talentIds.map(id => $talentsMap.get(id)).filter(Boolean) : [];

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
</script>

{#if project}
  <div class="detail-view">
    <div class="header">
      <a href="/" use:link class="back-link">← Retour à la liste</a>
      <h1>Détails du Projet</h1>
    </div>

    <div class="project-info card">
      <h2>{project.name || 'Projet sans nom'}</h2>

      {#if project.description}
        <p class="description">{project.description}</p>
      {/if}

      <div class="stats">
        {#if project.amount}
          <div class="stat-item">
            <span class="stat-label">Montant</span>
            <span class="stat-value amount">{formatAmount(project.amount)}</span>
          </div>
        {/if}
        {#if project.category}
          <div class="stat-item">
            <span class="stat-label">Catégorie</span>
            <span class="stat-value category">{project.category}</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="related-section">
      <h2>Informations Associées</h2>

      <div class="related-grid">
        {#if commission}
          <a href="/commission/{commission.id}" use:link class="related-card card clickable">
            <div class="card-label">Commission</div>
            <h3>{formatDate(commission.date)}</h3>
            {#if commission.aidName}
              <p class="meta">{commission.aidName}</p>
            {/if}
            <div class="card-footer">
              <span class="badge">{commission.projectIds?.length || 0} projets</span>
              {#if commission.president}
                <span class="president">Président : {commission.president}</span>
              {/if}
            </div>
          </a>
        {/if}

        {#if beneficiary}
          <a href="/beneficiary/{beneficiary.id}" use:link class="related-card card clickable">
            <div class="card-label">Bénéficiaire</div>
            <h3>{beneficiary.name}</h3>
            <div class="card-footer">
              <span class="badge">{beneficiary.projectIds?.length || 0} projets</span>
              <span class="badge">{beneficiary.commissionIds?.length || 0} commissions</span>
            </div>
          </a>
        {/if}

        {#each talents as talent}
          <a href="/talent/{talent.id}" use:link class="related-card card clickable">
            <div class="card-label">Talent</div>
            <h3>{talent.name}</h3>
            <div class="card-footer">
              <span class="badge">{talent.projectIds?.length || 0} projets</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  </div>
{:else}
  <div class="detail-view">
    <div class="header">
      <a href="/" use:link class="back-link">← Retour à la liste</a>
    </div>
    <div class="card">
      <p>Projet non trouvé</p>
    </div>
  </div>
{/if}

<style>
  .detail-view {
    width: 100%;
  }

  .header {
    margin-bottom: 30px;
  }

  .back-link {
    display: inline-block;
    color: #0047ab;
    text-decoration: none;
    margin-bottom: 10px;
    font-size: 0.95rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    color: #0047ab;
    font-size: 2rem;
    margin: 0;
  }

  h2 {
    color: #0047ab;
    font-size: 1.5rem;
    margin: 0 0 20px 0;
  }

  h3 {
    color: #0047ab;
    font-size: 1.2rem;
    margin: 0 0 10px 0;
  }

  .card {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
  }

  .project-info {
    border-left: 4px solid #0047ab;
  }

  .description {
    color: #212529;
    line-height: 1.6;
    margin: 15px 0;
    font-size: 1rem;
  }

  .stats {
    display: flex;
    gap: 40px;
    padding: 20px 0;
    border-top: 1px solid #dee2e6;
    margin-top: 20px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .stat-label {
    color: #6c757d;
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  .stat-value {
    color: #0047ab;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .stat-value.amount {
    color: #ff6b6b;
  }

  .stat-value.category {
    font-size: 1.2rem;
    font-weight: 500;
  }

  .related-section h2 {
    margin-bottom: 20px;
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
    gap: 20px;
  }

  .related-card {
    border-left: 4px solid #0047ab;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  .related-card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
    cursor: pointer;
  }

  .card-label {
    color: #6c757d;
    font-size: 0.75rem;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }

  .related-card h3 {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }

  .meta {
    color: #6c757d;
    font-size: 0.9rem;
    margin: 10px 0;
  }

  .card-footer {
    margin-top: auto;
    padding-top: 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
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

  .president {
    color: #6c757d;
    font-size: 0.85rem;
  }

  .amount {
    color: #ff6b6b;
    font-weight: 600;
  }
</style>

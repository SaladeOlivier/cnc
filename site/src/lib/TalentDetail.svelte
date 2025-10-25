<script>
  import { talentsMap, projectsMap, commissionsMap, beneficiariesMap } from '../stores/data.js';
  import { link } from 'svelte-spa-router';

  export let params = {};

  $: talent = $talentsMap.get(params.id);
  $: projects = talent?.projectIds?.map(id => {
    const project = $projectsMap.get(id);
    if (!project) return null;

    return {
      ...project,
      beneficiary: project.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId) : null,
      commission: project.commissionId ? $commissionsMap.get(project.commissionId) : null
    };
  }).filter(Boolean) || [];

  $: totalAmount = projects.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Get commissions where this talent is a member/president
  $: commissions = talent?.commissionIds?.map(id => $commissionsMap.get(id)).filter(Boolean) || [];

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

{#if talent}
  <div class="detail-view">
    <div class="header">
      <a href="/" use:link class="back-link">← Retour à la liste</a>
      <h1>Détails du Talent</h1>
    </div>

    <div class="talent-info card">
      <h2>{talent.name}</h2>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Projets</span>
          <span class="stat-value">{projects.length}</span>
        </div>
        {#if commissions.length > 0}
          <div class="stat-item">
            <span class="stat-label">Commissions</span>
            <span class="stat-value">{commissions.length}</span>
          </div>
        {/if}
        <div class="stat-item">
          <span class="stat-label">Montant Total</span>
          <span class="stat-value amount">{formatAmount(totalAmount)}</span>
        </div>
      </div>
    </div>

    {#if commissions.length > 0}
      <div class="commissions-section">
        <h2>Participation à des Commissions ({commissions.length})</h2>
        <div class="commissions-grid">
          {#each commissions as commission}
            <a href="/commission/{commission.id}" use:link class="commission-card card clickable">
              <h3>{formatDate(commission.date)}</h3>
              {#if commission.aidName}
                <p class="meta">{commission.aidName}</p>
              {/if}
              <div class="card-footer">
                <span class="badge">{commission.projectIds?.length || 0} projets</span>
              </div>
            </a>
          {/each}
        </div>
      </div>
    {/if}

    <div class="projects-section">
      <h2>Projets ({projects.length})</h2>
      <div class="projects-grid">
        {#each projects as project}
          <a href="/project/{project.id}" use:link class="project-card card clickable">
            <h3>{project.name || 'Projet sans nom'}</h3>
            <div class="meta">
              {#if project.amount}
                <div class="meta-item amount">{formatAmount(project.amount)}</div>
              {/if}
              {#if project.beneficiary}
                <div class="meta-item">
                  <strong>Bénéficiaire :</strong> {project.beneficiary.name}
                </div>
              {/if}
              {#if project.commission}
                <div class="meta-item">
                  <strong>Commission :</strong> {formatDate(project.commission.date)}
                </div>
              {/if}
            </div>
            {#if project.description}
              <p class="description">{project.description}</p>
            {/if}
            {#if project.category}
              <span class="badge">{project.category}</span>
            {/if}
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
      <p>Talent non trouvé</p>
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

  .talent-info {
    border-left: 4px solid #0047ab;
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

  .commissions-section {
    margin-bottom: 30px;
  }

  .commissions-section h2 {
    margin-bottom: 20px;
  }

  .commissions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .commission-card {
    border-left: 4px solid #0047ab;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
  }

  .commission-card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .commission-card h3 {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }

  .card-footer {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #dee2e6;
  }

  .projects-section h2 {
    margin-bottom: 20px;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }

  .project-card {
    border-left: 4px solid #0047ab;
    text-decoration: none;
    color: inherit;
    transition: all 0.3s ease;
  }

  .project-card.clickable:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .project-card h3 {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }

  .meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.9rem;
    margin-bottom: 10px;
  }

  .meta-item {
    color: #6c757d;
  }

  .meta-item.amount {
    color: #ff6b6b;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .description {
    color: #212529;
    line-height: 1.5;
    margin: 10px 0;
    font-size: 0.9rem;
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
  }
</style>

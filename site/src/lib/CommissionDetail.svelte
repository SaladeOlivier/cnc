<script>
  import { commissionsMap, projectsMap, beneficiariesMap, talentsMap } from '../stores/data.js';
  import { link } from 'svelte-spa-router';

  export let params = {};

  $: commission = $commissionsMap.get(params.id);
  $: projects = commission?.projectIds?.map(id => {
    const project = $projectsMap.get(id);
    if (!project) return null;

    return {
      ...project,
      beneficiary: project.beneficiaryId ? $beneficiariesMap.get(project.beneficiaryId) : null,
      talents: project.talentIds ? project.talentIds.map(id => $talentsMap.get(id)).filter(Boolean) : []
    };
  }).filter(Boolean) || [];

  $: totalAmount = projects.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Resolve president and members from IDs
  $: president = commission?.presidentId ? $talentsMap.get(commission.presidentId) : null;
  $: members = commission?.memberIds?.map(id => $talentsMap.get(id)).filter(Boolean) || [];

  // Calculate statistics for each member
  $: memberStats = members.map(member => {
    const projectCount = member.projectIds?.length || 0;
    const commissionCount = member.commissionIds?.length || 0;
    return {
      ...member,
      projectCount,
      commissionCount
    };
  });

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

{#if commission}
  <div class="detail-view">
    <div class="header">
      <a href="/" use:link class="back-link">← Retour à la liste</a>
      <h1>Détails de la Commission</h1>
    </div>

    <div class="commission-info card">
      <div class="info-header">
        <div>
          <h2>{formatDate(commission.date)}</h2>
          {#if commission.aidName}
            <p class="aid-name">{commission.aidName}</p>
          {/if}
        </div>
        {#if commission.url}
          <a href={commission.url} target="_blank" rel="noopener noreferrer" class="external-link">
            Voir la page originale ↗
          </a>
        {/if}
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Projets</span>
          <span class="stat-value">{projects.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Montant Total</span>
          <span class="stat-value amount">{formatAmount(totalAmount)}</span>
        </div>
      </div>

      {#if president}
        <div class="section">
          <h3>Président</h3>
          <a href="/talent/{president.id}" use:link class="member-link">
            {president.name}
          </a>
        </div>
      {/if}

      {#if memberStats && memberStats.length > 0}
        <div class="section">
          <h3>Membres ({memberStats.length})</h3>
          <div class="members-grid">
            {#each memberStats as member}
              <a href="/talent/{member.id}" use:link class="member-card">
                <div class="member-name">{member.name}</div>
                <div class="member-stats">
                  <span class="member-stat" title="Projets financés">
                    <strong>{member.projectCount}</strong> {member.projectCount === 1 ? 'projet' : 'projets'}
                  </span>
                  <span class="member-stat" title="Participations aux commissions">
                    <strong>{member.commissionCount}</strong> {member.commissionCount === 1 ? 'commission' : 'commissions'}
                  </span>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="projects-section">
      <h2>Projets ({projects.length})</h2>
      <div class="projects-grid">
        {#each projects as project}
          <a href="/project/{project.id}" use:link class="project-card card clickable">
            <h3>{project.name || 'Projet sans nom'}</h3>
            <div class="meta">
              {#if project.beneficiary}
                <div class="meta-item">
                  <strong>Bénéficiaire :</strong> {project.beneficiary.name}
                </div>
              {/if}
              {#if project.amount}
                <div class="meta-item amount">{formatAmount(project.amount)}</div>
              {/if}
              {#if project.talents && project.talents.length > 0}
                <div class="meta-item">
                  <strong>{project.talents.length === 1 ? 'Talent' : 'Talents'} :</strong> {project.talents.map(t => t.name).join(', ')}
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
      <p>Commission non trouvée</p>
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

  .commission-info {
    border-left: 4px solid #0047ab;
  }

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .aid-name {
    color: #6c757d;
    margin-top: 5px;
    font-size: 1.1rem;
  }

  .external-link {
    background: #0047ab;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    text-decoration: none;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: background 0.2s;
  }

  .external-link:hover {
    background: #003580;
  }

  .stats {
    display: flex;
    gap: 40px;
    padding: 20px 0;
    border-top: 1px solid #dee2e6;
    border-bottom: 1px solid #dee2e6;
    margin-bottom: 20px;
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

  .section {
    margin-top: 20px;
  }

  .member-link {
    color: #0047ab;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .member-link:hover {
    color: #003580;
    text-decoration: underline;
  }

  .members-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
    gap: 15px;
  }

  .member-card {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    border: 2px solid transparent;
  }

  .member-card:hover {
    background: #e9ecef;
    border-color: #0047ab;
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0, 71, 171, 0.1);
  }

  .member-name {
    color: #0047ab;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 10px;
  }

  .member-stats {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .member-stat {
    color: #6c757d;
    font-size: 0.85rem;
  }

  .member-stat strong {
    color: #0047ab;
    font-weight: 700;
  }

  .projects-section h2 {
    margin-bottom: 20px;
  }

  .projects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(350px, 100%), 1fr));
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

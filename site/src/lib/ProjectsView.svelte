<script>
  import { filteredProjects } from '../stores/data.js';
  import ProjectCard from './ProjectCard.svelte';
</script>

<div class="view-header">
  <h2>Projets</h2>
  <span class="count">{$filteredProjects.length} projet{$filteredProjects.length !== 1 ? 's' : ''}</span>
</div>

<div class="results-list">
  {#if $filteredProjects.length === 0}
    <p class="empty-state">Pas de projet trouvé</p>
  {:else}
    {#each $filteredProjects as project (project.id)}
      <ProjectCard {project} />
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
</style>

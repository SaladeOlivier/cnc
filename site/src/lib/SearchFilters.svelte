<script>
  import { searchTerm, yearFilter, aidFilter, sortBy, filterOptions } from '../stores/data.js';
</script>

<section class="search-section">
  <div class="search-bar">
    <input
      type="text"
      bind:value={$searchTerm}
      placeholder="Recherche par nom, projet, bénéficiaire, ..."
    />
    <button on:click={() => { $searchTerm = ''; $yearFilter = ''; $aidFilter = ''; }}>
      Effacer
    </button>
  </div>

  <div class="filters">
    <div class="filter-group">
      <label for="year">Année:</label>
      <select id="year" bind:value={$yearFilter}>
        <option value="">Toutes les années</option>
        {#each $filterOptions.years as year}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="aid">Type d'aide:</label>
      <select id="aid" bind:value={$aidFilter}>
        <option value="">Toutes les aides</option>
        {#each $filterOptions.aids as aid}
          <option value={aid}>{aid}</option>
        {/each}
      </select>
    </div>

    <div class="filter-group">
      <label for="sort">Trier par:</label>
      <select id="sort" bind:value={$sortBy}>
        <option value="date-desc">Date (nouveau)</option>
        <option value="date-asc">Date (ancien)</option>
        <option value="amount-desc">Montant (le plus haut)</option>
        <option value="amount-asc">Montant (le plus bas)</option>
        <option value="name">Nom (A-Z)</option>
      </select>
    </div>
  </div>
</section>

<style>
  .search-section {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 20px;
  }

  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 1rem;
  }

  input:focus {
    outline: none;
    border-color: #0047ab;
  }

  button {
    padding: 12px 24px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }

  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr));
    gap: 15px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  label {
    font-size: 0.9rem;
    font-weight: 500;
    color: #6c757d;
  }

  select {
    padding: 10px;
    border: 2px solid #dee2e6;
    border-radius: 6px;
    font-size: 1rem;
    background: white;
    cursor: pointer;
    width: 100%;
    max-width: 100%;
    text-overflow: ellipsis;
  }

  select option {
    text-overflow: ellipsis;
    overflow: hidden;
  }

  select:focus {
    outline: none;
    border-color: #0047ab;
  }

  @media (max-width: 768px) {
    .search-section {
      padding: 15px;
    }

    .search-bar {
      flex-direction: column;
    }

    input,
    button,
    select {
      padding: 10px 12px;
      font-size: 0.95rem;
    }

    button {
      padding: 10px 16px;
    }

    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>

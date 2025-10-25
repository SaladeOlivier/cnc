<script>
  import { link } from 'svelte-spa-router';
</script>

<header>
  <a href="/" use:link class="title-link">
    <h1>Financements du CNC</h1>
  </a>
  <p class="subtitle">Moteur de recherches et analyse des decisions du Centre National du Cinéma</p>
</header>

<style>
  header {
    text-align: center;
    margin-bottom: 30px;
    padding: 40px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .title-link {
    text-decoration: none;
    color: inherit;
    display: inline-block;
    transition: transform 0.2s ease;
  }

  .title-link:hover {
    transform: scale(1.02);
  }

  h1 {
    color: #0047ab;
    font-size: 2.5rem;
    margin-bottom: 10px;
    cursor: pointer;
  }

  .subtitle {
    color: #6c757d;
    font-size: 1.1rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }
  }
</style>

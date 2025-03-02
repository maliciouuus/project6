// ===============================
// CONFIGURATION & CONSTANTES
// ===============================
// Point d'entrée de l'API OCMovies
const API = 'http://localhost:8000/api/v1';
// Nombre maximum de films affichés par catégorie (6 sur desktop)
const MOVIES_PER_CATEGORY = 6;

// ===============================
// SÉLECTEURS DOM
// ===============================
// Modal pour afficher les détails des films
const modal = document.getElementById('movie-modal');
// Bouton de fermeture de la modal
const closeModal = modal.querySelector('.close-modal');
// Section du meilleur film en haut de page
const bestMovieSection = document.getElementById('best-movie');
// Select pour filtrer par catégorie
const categorySelect = document.getElementById('category-select');

// ===============================
// GESTION DE LA MODAL
// ===============================
function openModal(movieData) {
    modal.classList.add('active');
    populateModal(movieData);
}

function closeModalHandler() {
    modal.classList.remove('active');
}

// Event listeners pour la modal
closeModal.addEventListener('click', closeModalHandler);
window.addEventListener('click', e => {
    if (e.target === modal) closeModalHandler();
});

// ===============================
// FONCTIONS API
// ===============================
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
}

// ===============================
// CRÉATION DES ÉLÉMENTS
// ===============================
function createMovieCard(movie) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
        <img 
            src="${movie.image_url}" 
            alt="${movie.title}" 
            onerror="this.src='img/default-movie.jpg'"
        >
    `;
    card.addEventListener('click', () => showMovieDetails(movie.id));
    return card;
}

// ===============================
// GESTION DES FILMS
// ===============================
async function showMovieDetails(movieId) {
    const movie = await fetchData(`${API}/titles/${movieId}`);
    if (!movie) return;

    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="movie-details">
            <img src="${movie.image_url}" alt="${movie.title}" onerror="this.src='img/default-movie.jpg'">
            <div class="movie-info">
                <h2>${movie.title}</h2>
                <p class="meta">
                    ${movie.year} • ${movie.duration}min • ${movie.rated || 'Non classé'} 
                    • IMDB: ${movie.imdb_score}/10
                </p>
                <p><strong>Genre:</strong> ${movie.genres.join(', ')}</p>
                <p><strong>Réalisateur:</strong> ${movie.directors.join(', ')}</p>
                <p><strong>Acteurs:</strong> ${movie.actors.join(', ')}</p>
                <p><strong>Pays:</strong> ${movie.countries.join(', ')}</p>
                ${movie.worldwide_gross_income ? 
                    `<p><strong>Box Office:</strong> $${movie.worldwide_gross_income.toLocaleString()}</p>` 
                    : ''}
                <p class="description">${movie.description || 'Aucune description disponible.'}</p>
            </div>
        </div>
    `;
    openModal();
}

// ===============================
// CHARGEMENT DES SECTIONS
// ===============================
async function loadMovieSection(url, containerId) {
    const data = await fetchData(`${url}&page_size=20`);
    if (!data?.results) return;

    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Mélange et limite le nombre de films
    const movies = data.results
        .sort(() => Math.random() - 0.5)
        .slice(0, MOVIES_PER_CATEGORY);

    movies.forEach(movie => container.appendChild(createMovieCard(movie)));

    // Gestion du bouton "Voir plus"
    setupShowMoreButton(container, movies);
}

// ===============================
// GESTION RESPONSIVE
// ===============================
function setupShowMoreButton(container, movies) {
    const section = container.closest('section');
    const showMoreBtn = section.querySelector('.show-more');

    function updateShowMore() {
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
        const shouldShowButton = (isMobile && movies.length > 2) || 
                               (isTablet && movies.length > 4);
        
        showMoreBtn.style.display = shouldShowButton ? 'block' : 'none';
        container.classList.remove('expanded');
    }

    showMoreBtn.onclick = () => {
        container.classList.add('expanded');
        showMoreBtn.style.display = 'none';
    };

    updateShowMore();
    window.addEventListener('resize', updateShowMore);
}

// ===============================
// MEILLEUR FILM
// ===============================
async function loadBestMovie() {
    const data = await fetchData(`${API}/titles/?sort_by=-imdb_score&page_size=1`);
    if (!data?.results?.[0]) return;

    const movie = await fetchData(`${API}/titles/${data.results[0].id}`);
    if (!movie) return;

    bestMovieSection.style.setProperty('--movie-background', `url(${movie.image_url})`);
    
    bestMovieSection.querySelector('.movie-info').innerHTML = `
        <h1>${movie.title}</h1>
        <p class="meta">${movie.year} • ${movie.duration}min • IMDB: ${movie.imdb_score}/10</p>
        <p class="description">${movie.description}</p>
        <button class="btn-primary" onclick="showMovieDetails('${movie.id}')">
            Plus d'informations
        </button>
    `;
}

// ===============================
// CATÉGORIES
// ===============================
async function loadCategories() {
    const data = await fetchData(`${API}/genres/`);
    if (!data?.results) return;

    categorySelect.innerHTML = `
        <option value="">Choisir une catégorie</option>
        ${data.results.map(genre => 
            `<option value="${genre.name}">${genre.name}</option>`
        ).join('')}
    `;

    categorySelect.onchange = () => {
        if (categorySelect.value) {
            loadMovieSection(
                `${API}/titles/?genre=${categorySelect.value}&sort_by=-imdb_score`,
                'custom-category'
            );
        }
    };
}

// ===============================
// INITIALISATION
// ===============================
document.addEventListener('DOMContentLoaded', async () => {
    // Charge d'abord le meilleur film
    await loadBestMovie();

    // Charge ensuite toutes les sections en parallèle
    await Promise.all([
        loadMovieSection(`${API}/titles/?sort_by=-imdb_score`, 'top-rated'),
        loadMovieSection(`${API}/titles/?genre=Action&sort_by=-imdb_score`, 'action'),
        loadMovieSection(`${API}/titles/?genre=Comedy&sort_by=-imdb_score`, 'comedy'),
        loadCategories()
    ]);
});

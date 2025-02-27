// Configuration
const API = 'http://localhost:8000/api/v1';
const MOVIES_PER_CATEGORY = 6;

// Sélecteurs DOM
const modal = document.getElementById('movie-modal');
const closeModal = modal.querySelector('.close-modal');

// Gestionnaires d'événements modaux
closeModal.addEventListener('click', () => modal.classList.remove('active'));
window.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('active');
});

// Fonctions utilitaires
const fetchData = async url => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        return null;
    }
};

const createMovieCard = movie => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `<img src="${movie.image_url}" alt="${movie.title}" onerror="this.src='img/default-movie.jpg'">`;
    card.addEventListener('click', () => showMovieDetails(movie.id));
    return card;
};

const showMovieDetails = async movieId => {
    const movie = await fetchData(`${API}/titles/${movieId}`);
    if (!movie) return;

    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = `
        <div class="movie-details">
            <img src="${movie.image_url}" alt="${movie.title}" onerror="this.src='img/default-movie.jpg'">
            <div class="movie-info">
                <h2>${movie.title}</h2>
                <p class="meta">
                    ${movie.year} • ${movie.duration} min • ${movie.rated || 'Non classé'} • IMDB: ${movie.imdb_score}/10
                </p>
                <p><strong>Genre:</strong> ${movie.genres.join(', ')}</p>
                <p><strong>Réalisateur:</strong> ${movie.directors.join(', ')}</p>
                <p><strong>Acteurs:</strong> ${movie.actors.join(', ')}</p>
                <p><strong>Pays:</strong> ${movie.countries.join(', ')}</p>
                ${movie.worldwide_gross_income ? 
                    `<p><strong>Box Office:</strong> $${movie.worldwide_gross_income.toLocaleString()}</p>` : ''}
                <p class="description">${movie.description || 'Aucune description disponible.'}</p>
            </div>
        </div>
    `;
    modal.classList.add('active');
};

const loadMovieSection = async (url, containerId) => {
    const data = await fetchData(`${url}&page_size=20`);
    if (!data?.results) return;

    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Sélectionner et mélanger aléatoirement les films
    const movies = data.results
        .sort(() => Math.random() - 0.5)
        .slice(0, MOVIES_PER_CATEGORY);

    movies.forEach(movie => container.appendChild(createMovieCard(movie)));

    // Gérer le bouton "Voir plus"
    const section = container.closest('section');
    const showMoreBtn = section.querySelector('.show-more');

    const updateShowMore = () => {
        const isMobile = window.innerWidth <= 480;
        const isTablet = window.innerWidth <= 768 && window.innerWidth > 480;
        const shouldShowButton = (isMobile && movies.length > 2) || (isTablet && movies.length > 4);
        
        showMoreBtn.style.display = shouldShowButton ? 'block' : 'none';
        container.classList.remove('expanded');
    };

    showMoreBtn.onclick = () => {
        container.classList.add('expanded');
        showMoreBtn.style.display = 'none';
    };

    updateShowMore();
    window.addEventListener('resize', updateShowMore);
};

const loadBestMovie = async () => {
    const data = await fetchData(`${API}/titles/?sort_by=-imdb_score&page_size=1`);
    if (!data?.results?.[0]) return;

    const movie = await fetchData(`${API}/titles/${data.results[0].id}`);
    if (!movie) return;

    const header = document.getElementById('best-movie');
    header.style.setProperty('--movie-background', `url(${movie.image_url})`);
    
    header.querySelector('.movie-info').innerHTML = `
        <h1>${movie.title}</h1>
        <p class="meta">${movie.year} • ${movie.duration} min • IMDB: ${movie.imdb_score}/10</p>
        <p class="description">${movie.description}</p>
        <button class="btn-primary" onclick="showMovieDetails('${movie.id}')">Plus d'informations</button>
    `;
};

const loadCategories = async () => {
    const data = await fetchData(`${API}/genres/`);
    if (!data?.results) return;

    const select = document.getElementById('category-select');
    select.innerHTML = '<option value="">Choisir une catégorie</option>' +
        data.results
            .map(genre => `<option value="${genre.name}">${genre.name}</option>`)
            .join('');

    select.onchange = () => {
        if (select.value) {
            loadMovieSection(
                `${API}/titles/?genre=${select.value}&sort_by=-imdb_score`,
                'custom-category'
            );
        }
    };
};

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadBestMovie();
    await Promise.all([
        loadMovieSection(`${API}/titles/?sort_by=-imdb_score`, 'top-rated'),
        loadMovieSection(`${API}/titles/?genre=Action&sort_by=-imdb_score`, 'action'),
        loadMovieSection(`${API}/titles/?genre=Comedy&sort_by=-imdb_score`, 'comedy'),
        loadCategories()
    ]);
});

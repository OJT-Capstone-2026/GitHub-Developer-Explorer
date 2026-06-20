import { getUser, getRepos, getRateLimit } from './api.js';
import {
  showLoader,
  renderProfile,
  renderRepos,
  renderLanguages,
  renderRateLimit,
  showError
} from './ui.js';

// Application State
let state = {
  profile: null,
  repos: [],
  currentSort: 'stars', // Default sort key
  filterQuery: ''
};

/**
 * Filters and sorts the local repositories state based on current search query and sort choice
 */
function getProcessedRepos() {
  let processed = [...state.repos];

  // 1. Filter by search query
  if (state.filterQuery.trim()) {
    const q = state.filterQuery.toLowerCase();
    processed = processed.filter(repo => {
      const nameMatch = repo.name?.toLowerCase().includes(q);
      const descMatch = repo.description?.toLowerCase().includes(q);
      const langMatch = repo.language?.toLowerCase().includes(q);
      return nameMatch || descMatch || langMatch;
    });
  }

  // 2. Sort by selected parameter
  if (state.currentSort === 'stars') {
    processed.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else if (state.currentSort === 'name') {
    processed.sort((a, b) => a.name.localeCompare(b.name));
  } else if (state.currentSort === 'updated') {
    processed.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  }

  return processed;
}

/**
 * Updates UI sorting buttons state (adds active visual borders/glows)
 */
function updateSortButtonsUI() {
  const buttons = {
    stars: document.getElementById('sort-stars'),
    name: document.getElementById('sort-name'),
    updated: document.getElementById('sort-updated')
  };

  const activeClasses = ['bg-indigo-500/20', 'text-indigo-400', 'border-indigo-500/50', 'shadow-[0_0_15px_rgba(99,102,241,0.15)]'];
  const inactiveClasses = ['bg-slate-800/50', 'text-slate-400', 'border-slate-800/80', 'hover:bg-slate-800', 'hover:text-slate-200'];

  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    if (key === state.currentSort) {
      btn.classList.add(...activeClasses);
      btn.classList.remove(...inactiveClasses);
    } else {
      btn.classList.remove(...activeClasses);
      btn.classList.add(...inactiveClasses);
    }
  });
}

/**
 * Perform Search and data updates
 */
async function performSearch(username) {
  const trimmedUsername = username.trim();
  if (!trimmedUsername) return;

  // Show loading skeleton immediately
  showLoader();
  
  // Reset repository filter input
  const filterInput = document.getElementById('repo-filter');
  if (filterInput) filterInput.value = '';
  state.filterQuery = '';

  try {
    // Parallelize profile and repository API requests
    const [profileData, reposData] = await Promise.all([
      getUser(trimmedUsername),
      getRepos(trimmedUsername)
    ]);

    // Save data to state
    state.profile = profileData;
    state.repos = reposData;

    // Render elements
    renderProfile(state.profile);
    renderLanguages(state.repos);
    
    // Sort and render repository grid
    const processed = getProcessedRepos();
    renderRepos(processed);
    
    // Update sort button styling
    updateSortButtonsUI();

  } catch (error) {
    console.error('Error fetching developer data:', error);
    showError(error.message);
  }
}

// Bind Global Application Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('username-input');
  const repoFilterInput = document.getElementById('repo-filter');
  const sortStarsBtn = document.getElementById('sort-stars');
  const sortNameBtn = document.getElementById('sort-name');
  const sortUpdatedBtn = document.getElementById('sort-updated');

  // Trigger search on submit
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = searchInput.value.trim();
      if (val) {
        // Update URL hash state for linkability/history
        window.location.hash = encodeURIComponent(val);
        performSearch(val);
      }
    });
  }

  // Repository Filtering (Live typing)
  if (repoFilterInput) {
    repoFilterInput.addEventListener('input', (e) => {
      state.filterQuery = e.target.value;
      const filtered = getProcessedRepos();
      renderRepos(filtered);
    });
  }

  // Repository Sorting handlers
  if (sortStarsBtn) {
    sortStarsBtn.addEventListener('click', () => {
      state.currentSort = 'stars';
      updateSortButtonsUI();
      renderRepos(getProcessedRepos());
    });
  }

  if (sortNameBtn) {
    sortNameBtn.addEventListener('click', () => {
      state.currentSort = 'name';
      updateSortButtonsUI();
      renderRepos(getProcessedRepos());
    });
  }

  if (sortUpdatedBtn) {
    sortUpdatedBtn.addEventListener('click', () => {
      state.currentSort = 'updated';
      updateSortButtonsUI();
      renderRepos(getProcessedRepos());
    });
  }

  // Listen to the custom rate limit update event from api.js
  window.addEventListener('github-rate-limit-updated', (e) => {
    renderRateLimit(e.detail);
  });

  // Pull initial rate limit status on page load
  try {
    const rateLimit = await getRateLimit();
    if (rateLimit) {
      renderRateLimit(rateLimit);
    }
  } catch (error) {
    console.warn('Could not load initial rate limit status:', error);
  }

  // Load username from URL hash if present (enables direct profiling links, e.g. index.html#torvalds)
  const initialHash = window.location.hash.substring(1);
  if (initialHash) {
    const decodedUser = decodeURIComponent(initialHash);
    if (searchInput) searchInput.value = decodedUser;
    performSearch(decodedUser);
  } else {
    // Default search example on landing
    const defaultUser = 'octocat';
    if (searchInput) searchInput.value = defaultUser;
    performSearch(defaultUser);
  }
});

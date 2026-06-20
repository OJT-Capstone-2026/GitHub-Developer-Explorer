// Global Chart.js instance tracking to prevent canvas reuse crashes
let languageChart = null;

// Default color mapping for popular GitHub languages
const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Ruby: '#701516',
  Java: '#b07219',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Shell: '#89e051',
  Vue: '#41b883',
  Angular: '#dd0031'
};

/**
 * Returns a static color mapping or generates a stable hashed color for new languages
 */
function getLanguageColor(lang) {
  if (!lang) return '#9ca3af';
  if (LANGUAGE_COLORS[lang]) return LANGUAGE_COLORS[lang];

  // Hash code generation for unknown languages
  let hash = 0;
  for (let i = 0; i < lang.length; i++) {
    hash = lang.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Formats ISO date string to a localized standard (e.g. Jan 14, 2008)
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Formats time relative to now (e.g. "3 days ago", "on Jan 14, 2008")
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 30) {
    return `on ${formatDate(dateString)}`;
  }
  if (diffDay > 0) {
    return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  }
  if (diffHour > 0) {
    return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  }
  if (diffMin > 0) {
    return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

/**
 * Utility to format repository size in KB/MB
 */
function formatSize(sizeInKb) {
  if (sizeInKb < 1024) {
    return `${sizeInKb} KB`;
  }
  return `${(sizeInKb / 1024).toFixed(1)} MB`;
}

/**
 * Toggles loader display. Renders animated skeletons inside profile and repo panels.
 */
export function showLoader() {
  const profileContainer = document.getElementById('profile-container');
  const reposContainer = document.getElementById('repos-container');
  const statsContainer = document.getElementById('stats-container');
  const errorContainer = document.getElementById('error-container');
  
  // Hide error container
  errorContainer.classList.add('d-none');
  errorContainer.innerHTML = '';

  // Show profiles skeletons
  profileContainer.innerHTML = `
    <div class="glass-panel glass-panel-glow rounded-4 p-4 d-flex flex-column align-items-center text-center">
      <div class="rounded-circle skeleton mb-3" style="width: 128px; height: 128px;"></div>
      <div class="skeleton mb-2" style="width: 192px; height: 24px;"></div>
      <div class="skeleton mb-3" style="width: 128px; height: 16px;"></div>
      <div class="skeleton mb-4 w-100" style="height: 48px;"></div>
      <div class="w-100 row g-2 mb-4">
        <div class="col-4"><div class="skeleton rounded-3" style="height: 64px;"></div></div>
        <div class="col-4"><div class="skeleton rounded-3" style="height: 64px;"></div></div>
        <div class="col-4"><div class="skeleton rounded-3" style="height: 64px;"></div></div>
      </div>
      <div class="w-100 d-flex flex-column gap-2 align-items-center">
        <div class="skeleton w-75" style="height: 16px;"></div>
        <div class="skeleton w-50" style="height: 16px;"></div>
        <div class="skeleton w-25" style="height: 16px;"></div>
      </div>
    </div>
  `;

  // Show stats skeleton
  statsContainer.innerHTML = `
    <div class="glass-panel rounded-4 p-4">
      <div class="skeleton mb-4" style="width: 192px; height: 24px;"></div>
      <div class="row g-4 align-items-center">
        <div class="col-md-5 d-flex justify-content-center">
          <div class="rounded-circle skeleton" style="width: 128px; height: 128px;"></div>
        </div>
        <div class="col-md-7 d-flex flex-column gap-3">
          <div class="skeleton w-100" style="height: 16px;"></div>
          <div class="skeleton w-75" style="height: 16px;"></div>
          <div class="skeleton w-50" style="height: 16px;"></div>
        </div>
      </div>
    </div>
  `;

  // Show repos skeletons
  reposContainer.innerHTML = `
    <div class="row g-3">
      ${Array(4).fill(0).map(() => `
        <div class="col-md-6">
          <div class="glass-panel rounded-3 p-4 d-flex flex-column gap-3">
            <div class="d-flex justify-content-between align-items-center">
               <div class="skeleton" style="width: 50%; height: 24px;"></div>
               <div class="skeleton rounded-pill" style="width: 64px; height: 20px;"></div>
            </div>
            <div class="skeleton w-100" style="height: 40px;"></div>
            <div class="d-flex gap-3">
               <div class="skeleton" style="width: 64px; height: 16px;"></div>
               <div class="skeleton" style="width: 48px; height: 16px;"></div>
               <div class="skeleton" style="width: 48px; height: 16px;"></div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Reveal elements during loading
  document.getElementById('display-wrapper').classList.remove('d-none');
}

/**
 * Hides visual loader. Not needed if we overwrite containers immediately.
 */
export function hideLoader() {
  // Overwriting elements automatically removes skeletons.
}

/**
 * Render GitHub user profile details card
 */
export function renderProfile(user) {
  const profileContainer = document.getElementById('profile-container');
  
  // Format joined date
  const joinedDate = formatDate(user.created_at);

  profileContainer.innerHTML = `
    <div class="glass-panel glass-panel-glow rounded-4 p-4 transition-all-300 hover-glow d-flex flex-column align-items-center">
      <!-- Profile Picture -->
      <div class="position-relative mb-3">
        <!-- Glow backing -->
        <div class="position-absolute top-0 start-0 w-100 h-100 rounded-circle blur opacity-50" style="background: linear-gradient(135deg, #0dcaf0, #6f42c1); z-index: 0; transform: scale(1.03);"></div>
        <img src="${user.avatar_url}" alt="${user.name || user.login}" class="position-relative rounded-circle border border-4 border-dark object-fit-cover" style="width: 128px; height: 128px; z-index: 1;">
      </div>

      <!-- Names -->
      <h2 class="h5 fw-bold text-white mb-1">${user.name || user.login}</h2>
      <a href="${user.html_url}" target="_blank" class="text-info text-decoration-none hover-light mb-3 d-flex align-items-center gap-1" style="font-size: 14px;">
        @${user.login}
        <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
      </a>

      <!-- Bio -->
      <p class="text-secondary text-center mb-4 px-2 fst-italic" style="font-size: 14px;">
        ${user.bio || 'This developer has no bio.'}
      </p>

      <!-- Stats Grid -->
      <div class="w-100 row g-2 text-center mb-4">
        <div class="col-4">
          <div class="bg-dark bg-opacity-25 border border-secondary border-opacity-25 rounded-3 py-2.5">
            <div class="h6 fw-bold text-info mb-0">${user.followers}</div>
            <div class="text-secondary uppercase tracking-wider fw-semibold" style="font-size: 9px;">Followers</div>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-dark bg-opacity-25 border border-secondary border-opacity-25 rounded-3 py-2.5">
            <div class="h6 fw-bold text-warning mb-0">${user.following}</div>
            <div class="text-secondary uppercase tracking-wider fw-semibold" style="font-size: 9px;">Following</div>
          </div>
        </div>
        <div class="col-4">
          <div class="bg-dark bg-opacity-25 border border-secondary border-opacity-25 rounded-3 py-2.5">
            <div class="h6 fw-bold text-danger mb-0">${user.public_repos}</div>
            <div class="text-secondary uppercase tracking-wider fw-semibold" style="font-size: 9px;">Repos</div>
          </div>
        </div>
      </div>

      <!-- Additional Details List -->
      <div class="w-100 d-flex flex-column gap-3 text-sm border-top border-secondary-subtle pt-4" style="font-size: 14px;">
        ${user.company ? `
          <div class="d-flex align-items-center text-light gap-3">
            <i data-lucide="building" class="text-info shrink-0" style="width: 16px; height: 16px;"></i>
            <span class="text-truncate">${user.company}</span>
          </div>
        ` : ''}
        
        ${user.location ? `
          <div class="d-flex align-items-center text-light gap-3">
            <i data-lucide="map-pin" class="text-danger shrink-0" style="width: 16px; height: 16px;"></i>
            <span class="text-truncate">${user.location}</span>
          </div>
        ` : ''}

        ${user.blog ? `
          <div class="d-flex align-items-center text-light gap-3">
            <i data-lucide="link" class="text-warning shrink-0" style="width: 16px; height: 16px;"></i>
            <a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" class="text-info text-decoration-none text-truncate hover-light">
              ${user.blog}
            </a>
          </div>
        ` : ''}

        ${user.twitter_username ? `
          <div class="d-flex align-items-center text-light gap-3">
            <i data-lucide="twitter" class="text-info shrink-0" style="width: 16px; height: 16px;"></i>
            <a href="https://twitter.com/${user.twitter_username}" target="_blank" class="text-info text-decoration-none text-truncate hover-light">
              @${user.twitter_username}
            </a>
          </div>
        ` : ''}

        <div class="d-flex align-items-center text-secondary gap-3 border-top border-secondary border-opacity-10 pt-3" style="font-size: 12px;">
          <i data-lucide="calendar" class="text-muted shrink-0" style="width: 14px; height: 14px;"></i>
          <span>Joined GitHub: ${joinedDate}</span>
        </div>
      </div>
    </div>
  `;
  
  // Reinitialize icons in new card
  lucide.createIcons();
}

/**
 * Renders lists of repository cards
 */
export function renderRepos(repos) {
  const reposContainer = document.getElementById('repos-container');
  
  if (repos.length === 0) {
    reposContainer.innerHTML = `
      <div class="glass-panel rounded-4 p-5 text-center text-secondary">
        <i data-lucide="folder-open" class="text-muted mb-3" style="width: 48px; height: 48px;"></i>
        <p class="fw-medium mb-0">No repositories found.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const repoCards = repos.map(repo => {
    const langColor = getLanguageColor(repo.language);
    return `
      <div class="col-md-6">
        <div class="glass-panel rounded-3 p-4 hover-glow transition-all-300 d-flex flex-column justify-content-between h-100 position-relative overflow-hidden group">
          <!-- Floating Accent Glow -->
          <div class="position-absolute top-0 end-0 w-25 h-25 bg-gradient opacity-0 group-hover-opacity-100 transition duration-500" style="background: radial-gradient(circle, rgba(13, 202, 240, 0.15), transparent); pointer-events: none;"></div>

          <div>
            <!-- Title & Stats Badge -->
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h3 class="h6 fw-semibold mb-0 text-truncate" style="max-width: 70%;">
                <a href="${repo.html_url}" target="_blank" class="text-white text-decoration-none hover-light d-inline-flex align-items-center gap-1.5">
                  ${repo.name}
                </a>
              </h3>
              <span class="badge bg-dark border border-secondary text-secondary rounded-pill px-2.5 py-1" style="font-size: 9px;">
                ${repo.private ? 'Private' : 'Public'}
              </span>
            </div>

            <!-- Description -->
            <p class="text-secondary text-sm mb-3 text-start" style="font-size: 13px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 38px;">
              ${repo.description || 'No description provided.'}
            </p>
          </div>

          <!-- Meta Grid -->
          <div class="d-flex align-items-center justify-content-between text-secondary border-top border-secondary border-opacity-25 pt-3 mt-auto" style="font-size: 12px;">
            <!-- Left side: Language -->
            <div class="d-flex align-items-center gap-1.5 fw-medium">
              ${repo.language ? `
                <span class="rounded-circle d-inline-block" style="width: 10px; height: 10px; background-color: ${langColor};"></span>
                <span>${repo.language}</span>
              ` : '<span>Markdown/Text</span>'}
            </div>

            <!-- Right side: Stats -->
            <div class="d-flex align-items-center gap-3 fw-semibold">
              <span class="d-flex align-items-center gap-1" title="Stars">
                <i data-lucide="star" class="text-warning" style="width: 14px; height: 14px;"></i>
                <span>${repo.stargazers_count}</span>
              </span>
              <span class="d-flex align-items-center gap-1" title="Forks">
                <i data-lucide="git-fork" class="text-info" style="width: 14px; height: 14px;"></i>
                <span>${repo.forks_count}</span>
              </span>
              <span class="text-muted d-none d-sm-inline" title="Size">
                ${formatSize(repo.size)}
              </span>
            </div>
          </div>

          <div class="text-secondary mt-2 text-end" style="font-size: 10px;">
            Updated ${formatRelativeTime(repo.updated_at)}
          </div>
        </div>
      </div>
    `;
  }).join('');

  reposContainer.innerHTML = `
    <div class="row g-3">
      ${repoCards}
    </div>
  `;
  
  // Reinitialize icons in container
  lucide.createIcons();
}

/**
 * Calculates language usage statistics and builds Chart.js donut chart and progress bars
 */
export function renderLanguages(repos) {
  const statsContainer = document.getElementById('stats-container');
  
  // Exclude repos without main language
  const activeRepos = repos.filter(repo => repo.language);
  
  if (activeRepos.length === 0) {
    statsContainer.innerHTML = `
      <div class="glass-panel rounded-4 p-4 text-center text-secondary">
        <p class="fw-medium mb-0">No programming languages statistics available.</p>
      </div>
    `;
    return;
  }

  // Count primary languages
  const counts = {};
  activeRepos.forEach(repo => {
    counts[repo.language] = (counts[repo.language] || 0) + 1;
  });

  // Convert to sorted array
  const sortedLangs = Object.entries(counts)
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count);

  // Group languages after top 5 into "Other"
  let processedLangs = [];
  if (sortedLangs.length > 5) {
    processedLangs = sortedLangs.slice(0, 5);
    const otherCount = sortedLangs.slice(5).reduce((acc, curr) => acc + curr.count, 0);
    processedLangs.push({ lang: 'Others', count: otherCount });
  } else {
    processedLangs = sortedLangs;
  }

  const totalLanguages = activeRepos.length;

  // Prepare UI layout for chart and progress bars
  statsContainer.innerHTML = `
    <div class="glass-panel rounded-4 p-4 hover-glow transition-all-300">
      <h3 class="h6 fw-bold text-white mb-4 d-flex align-items-center gap-2">
        <i data-lucide="pie-chart" class="text-info"></i>
        Language Breakdown
      </h3>
      <div class="row g-4 align-items-center">
        <!-- Chart.js Canvas Container -->
        <div class="col-md-5 d-flex justify-content-center">
          <div class="position-relative" style="width: 140px; height: 140px;">
            <canvas id="language-chart"></canvas>
          </div>
        </div>

        <!-- Detailed Progress Bars List -->
        <div class="col-md-7 d-flex flex-column gap-3">
          ${processedLangs.map(item => {
            const pct = ((item.count / totalLanguages) * 100).toFixed(0);
            const color = getLanguageColor(item.lang);
            return `
              <div>
                <div class="d-flex justify-content-between text-secondary fw-semibold mb-1" style="font-size: 12px;">
                  <span class="text-light d-flex align-items-center gap-1.5">
                    <span class="rounded-circle d-inline-block" style="width: 8px; height: 8px; background-color: ${color};"></span>
                    ${item.lang}
                  </span>
                  <span>${item.count} repo${item.count > 1 ? 's' : ''} (${pct}%)</span>
                </div>
                <div class="progress bg-dark rounded-pill border border-secondary border-opacity-10" style="height: 6px;">
                  <div class="progress-bar rounded-pill transition-all" role="progressbar" style="width: ${pct}%; background-color: ${color};" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Extract chart labels, dataset data and colors
  const labels = processedLangs.map(item => item.lang);
  const data = processedLangs.map(item => item.count);
  const backgroundColors = processedLangs.map(item => getLanguageColor(item.lang));

  // Initialize/Update Chart.js Donut Chart
  const ctx = document.getElementById('language-chart').getContext('2d');
  
  if (languageChart) {
    languageChart.destroy();
  }

  languageChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 2,
        borderColor: '#161b22', // Match card background
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false // We use our own progress bars as legend
        },
        tooltip: {
          backgroundColor: '#1f2937',
          titleColor: '#f9fafb',
          bodyColor: '#d1d5db',
          borderColor: '#374151',
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          callbacks: {
            label: function(context) {
              const count = context.raw;
              const percentage = ((count / totalLanguages) * 100).toFixed(0);
              return ` ${context.label}: ${count} repos (${percentage}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });

  // Re-create icons for the panel header
  lucide.createIcons();
}

/**
 * Render remaining GitHub API rate limits
 */
export function renderRateLimit(rateLimit) {
  const badge = document.getElementById('rate-limit-badge');
  if (!rateLimit) {
    badge.classList.add('d-none');
    return;
  }

  const { limit, remaining, reset } = rateLimit;
  badge.classList.remove('d-none');

  // Calculate remaining time in minutes
  const timeDiff = reset - Date.now();
  const minsRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60)));

  let statusColor = 'text-success border-success-subtle bg-success bg-opacity-10';
  if (remaining < 15) {
    statusColor = 'text-warning border-warning-subtle bg-warning bg-opacity-10';
  }
  if (remaining === 0) {
    statusColor = 'text-danger border-danger-subtle bg-danger bg-opacity-10';
  }

  badge.className = `d-flex align-items-center gap-1.5 border px-3 py-1 rounded-pill text-xs fw-medium ${statusColor}`;
  badge.innerHTML = `
    <i data-lucide="gauge" style="width: 14px; height: 14px;"></i>
    <span>Rate Limit: <b>${remaining}</b> / ${limit}</span>
    ${remaining < limit ? `<span class="text-secondary ms-1">(Resets in ${minsRemaining}m)</span>` : ''}
  `;

  lucide.createIcons();
}

/**
 * Renders styled full-screen or card-level error alerts
 */
export function showError(type) {
  const errorContainer = document.getElementById('error-container');
  const displayWrapper = document.getElementById('display-wrapper');
  
  // Hide main cards during severe error
  displayWrapper.classList.add('d-none');
  errorContainer.classList.remove('d-none');

  let title = 'Oops! Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let icon = 'alert-triangle';
  let color = 'text-danger border-danger bg-danger bg-opacity-10';

  if (type === 'USER_NOT_FOUND') {
    title = 'User Not Found';
    message = 'The username you searched for does not exist on GitHub. Please check the spelling and try again.';
    icon = 'user-x';
    color = 'text-warning border-warning bg-warning bg-opacity-10';
  } else if (type === 'INVALID_TOKEN') {
    title = 'Invalid API Token';
    message = 'The GitHub Personal Access Token in your .env file is invalid or expired. Please check your token format and permissions.';
    icon = 'shield-alert';
    color = 'text-danger border-danger bg-danger bg-opacity-10';
  } else if (type === 'FORBIDDEN') {
    title = 'Access Forbidden';
    message = 'The request was forbidden. If you are using a Personal Access Token, ensure it has the correct permissions.';
    icon = 'shield-off';
    color = 'text-danger border-danger bg-danger bg-opacity-10';
  } else if (type === 'API_RATE_LIMIT_EXCEEDED') {
    title = 'Rate Limit Exceeded';
    message = 'GitHub API Rate Limit has been exceeded. Please check back later or set up a Personal Access Token.';
    icon = 'hourglass';
    color = 'text-danger border-danger bg-danger bg-opacity-10';
  } else if (type === 'NETWORK_ERROR') {
    title = 'Network Connection Error';
    message = 'Unable to connect to GitHub. Please check your internet connection and try again.';
    icon = 'wifi-off';
    color = 'text-danger border-danger bg-danger bg-opacity-10';
  } else if (type && type.startsWith('HTTP_ERROR_')) {
    const statusCode = type.replace('HTTP_ERROR_', '');
    title = `HTTP Error ${statusCode}`;
    message = `GitHub API returned an error status code ${statusCode}. Please try again later.`;
    icon = 'alert-circle';
    color = 'text-danger border-danger bg-danger bg-opacity-10';
  }

  errorContainer.innerHTML = `
    <div class="glass-panel max-w-xl mx-auto rounded-4 p-4 border ${color} d-flex flex-column align-items-center text-center transition-all-300" style="max-width: 500px;">
      <div class="p-3 rounded-circle bg-dark bg-opacity-50 mb-3 border border-secondary border-opacity-25">
        <i data-lucide="${icon}" style="width: 32px; height: 32px;"></i>
      </div>
      <h3 class="h5 fw-bold mb-2">${title}</h3>
      <p class="text-secondary text-sm mb-0">${message}</p>
    </div>
  `;

  lucide.createIcons();
}

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
  errorContainer.classList.add('hidden');
  errorContainer.innerHTML = '';

  // Show profiles skeletons
  profileContainer.innerHTML = `
    <div class="glass-panel glass-panel-glow rounded-2xl p-6 flex flex-col items-center text-center">
      <div class="w-32 h-32 rounded-full skeleton mb-4"></div>
      <div class="w-48 h-6 skeleton mb-2"></div>
      <div class="w-32 h-4 skeleton mb-4"></div>
      <div class="w-full h-12 skeleton mb-6"></div>
      <div class="w-full grid grid-cols-3 gap-2 mb-6">
        <div class="h-16 skeleton rounded-xl"></div>
        <div class="h-16 skeleton rounded-xl"></div>
        <div class="h-16 skeleton rounded-xl"></div>
      </div>
      <div class="w-full space-y-3">
        <div class="h-4 skeleton w-3/4"></div>
        <div class="h-4 skeleton w-2/3"></div>
        <div class="h-4 skeleton w-1/2"></div>
      </div>
    </div>
  `;

  // Show stats skeleton
  statsContainer.innerHTML = `
    <div class="glass-panel rounded-2xl p-6">
      <div class="w-48 h-6 skeleton mb-6"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div class="h-48 w-48 rounded-full skeleton mx-auto"></div>
        <div class="space-y-4">
          <div class="h-6 skeleton w-full"></div>
          <div class="h-6 skeleton w-5/6"></div>
          <div class="h-6 skeleton w-4/5"></div>
          <div class="h-6 skeleton w-2/3"></div>
        </div>
      </div>
    </div>
  `;

  // Show repos skeletons
  reposContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${Array(4).fill(0).map(() => `
        <div class="glass-panel rounded-xl p-5 space-y-4">
          <div class="flex justify-between items-start">
            <div class="w-1/2 h-6 skeleton"></div>
            <div class="w-16 h-5 skeleton rounded-full"></div>
          </div>
          <div class="w-full h-8 skeleton"></div>
          <div class="flex space-x-4">
            <div class="w-16 h-4 skeleton"></div>
            <div class="w-12 h-4 skeleton"></div>
            <div class="w-12 h-4 skeleton"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // Reveal elements during loading
  document.getElementById('display-wrapper').classList.remove('hidden');
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
    <div class="glass-panel glass-panel-glow rounded-2xl p-6 transition-all-300 hover-glow flex flex-col items-center">
      <!-- Profile Picture -->
      <div class="relative group mb-4">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-violet-500 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
        <img src="${user.avatar_url}" alt="${user.name || user.login}" class="relative w-32 h-32 rounded-full border-4 border-slate-900 object-cover">
      </div>

      <!-- Names -->
      <h2 class="text-xl font-bold text-slate-100">${user.name || user.login}</h2>
      <a href="${user.html_url}" target="_blank" class="text-sky-400 hover:underline text-sm font-medium mb-3 flex items-center gap-1">
        @${user.login}
        <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
      </a>

      <!-- Bio -->
      <p class="text-slate-400 text-sm text-center mb-6 px-2 italic">
        ${user.bio || 'This developer has no bio.'}
      </p>

      <!-- Stats Grid -->
      <div class="w-full grid grid-cols-3 gap-2 text-center mb-6">
        <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5">
          <div class="text-base font-extrabold text-sky-400">${user.followers}</div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Followers</div>
        </div>
        <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5">
          <div class="text-base font-extrabold text-violet-400">${user.following}</div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Following</div>
        </div>
        <div class="bg-slate-800/40 border border-slate-700/30 rounded-xl p-2.5">
          <div class="text-base font-extrabold text-pink-400">${user.public_repos}</div>
          <div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Repos</div>
        </div>
      </div>

      <!-- Additional Details List -->
      <div class="w-full space-y-3.5 text-sm border-t border-slate-800 pt-5">
        ${user.company ? `
          <div class="flex items-center text-slate-300 gap-3">
            <i data-lucide="building" class="w-4 h-4 text-sky-400 shrink-0"></i>
            <span class="truncate">${user.company}</span>
          </div>
        ` : ''}
        
        ${user.location ? `
          <div class="flex items-center text-slate-300 gap-3">
            <i data-lucide="map-pin" class="w-4 h-4 text-pink-400 shrink-0"></i>
            <span class="truncate">${user.location}</span>
          </div>
        ` : ''}

        ${user.blog ? `
          <div class="flex items-center text-slate-300 gap-3">
            <i data-lucide="link" class="w-4 h-4 text-violet-400 shrink-0"></i>
            <a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" class="hover:text-sky-400 truncate hover:underline">
              ${user.blog}
            </a>
          </div>
        ` : ''}

        ${user.twitter_username ? `
          <div class="flex items-center text-slate-300 gap-3">
            <i data-lucide="twitter" class="w-4 h-4 text-sky-400 shrink-0"></i>
            <a href="https://twitter.com/${user.twitter_username}" target="_blank" class="hover:text-sky-400 truncate hover:underline">
              @${user.twitter_username}
            </a>
          </div>
        ` : ''}

        <div class="flex items-center text-slate-400 text-xs gap-3 border-t border-slate-800/50 pt-3">
          <i data-lucide="calendar" class="w-3.5 h-3.5 text-slate-500 shrink-0"></i>
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
      <div class="glass-panel rounded-2xl p-10 text-center text-slate-400">
        <i data-lucide="folder-open" class="w-12 h-12 mx-auto mb-3 text-slate-500"></i>
        <p class="font-medium">No repositories found.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const repoCards = repos.map(repo => {
    const langColor = getLanguageColor(repo.language);
    return `
      <div class="glass-panel rounded-xl p-5 hover-glow transition-all-300 flex flex-col justify-between h-full relative overflow-hidden group">
        <!-- Floating Accent Glow -->
        <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-sky-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div>
          <!-- Title & Stats Badge -->
          <div class="flex justify-between items-start gap-2 mb-2">
            <h3 class="font-semibold text-slate-100 text-base group-hover:text-sky-400 transition-colors truncate max-w-[70%]">
              <a href="${repo.html_url}" target="_blank" class="hover:underline flex items-center gap-1.5">
                ${repo.name}
              </a>
            </h3>
            <span class="text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700/60 rounded-full px-2.5 py-0.5 shrink-0">
              ${repo.private ? 'Private' : 'Public'}
            </span>
          </div>

          <!-- Description -->
          <p class="text-slate-400 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
            ${repo.description || 'No description provided.'}
          </p>
        </div>

        <!-- Meta Grid -->
        <div class="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-3.5 mt-auto">
          <!-- Left side: Language -->
          <div class="flex items-center gap-1.5 font-medium">
            ${repo.language ? `
              <span class="w-3 h-3 rounded-full inline-block" style="background-color: ${langColor};"></span>
              <span>${repo.language}</span>
            ` : '<span>Markdown/Text</span>'}
          </div>

          <!-- Right side: Stats -->
          <div class="flex items-center gap-3 font-semibold">
            <span class="flex items-center gap-1" title="Stars">
              <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400"></i>
              <span>${repo.stargazers_count}</span>
            </span>
            <span class="flex items-center gap-1" title="Forks">
              <i data-lucide="git-fork" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>${repo.forks_count}</span>
            </span>
            <span class="text-slate-500 hidden sm:inline" title="Size">
              ${formatSize(repo.size)}
            </span>
          </div>
        </div>

        <div class="text-[10px] text-slate-500 mt-2 text-right">
          Updated ${formatRelativeTime(repo.updated_at)}
        </div>
      </div>
    `;
  }).join('');

  reposContainer.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div class="glass-panel rounded-2xl p-6 text-center text-slate-400">
        <p class="font-medium">No programming languages statistics available.</p>
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
    <div class="glass-panel rounded-2xl p-6 hover-glow transition-all-300">
      <h3 class="text-base font-bold text-slate-100 mb-6 flex items-center gap-2">
        <i data-lucide="pie-chart" class="w-5 h-5 text-indigo-400"></i>
        Language Breakdown
      </h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        <!-- Chart.js Canvas Container -->
        <div class="relative w-44 h-44 mx-auto flex items-center justify-center">
          <canvas id="language-chart"></canvas>
        </div>

        <!-- Detailed Progress Bars List -->
        <div class="space-y-4">
          ${processedLangs.map(item => {
            const pct = ((item.count / totalLanguages) * 100).toFixed(0);
            const color = getLanguageColor(item.lang);
            return `
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-300 flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${color};"></span>
                    ${item.lang}
                  </span>
                  <span class="text-slate-400">${item.count} repo${item.count > 1 ? 's' : ''} (${pct}%)</span>
                </div>
                <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/20">
                  <div class="h-2 rounded-full transition-all duration-1000" style="width: ${pct}%; background-color: ${color};"></div>
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
    badge.classList.add('hidden');
    return;
  }

  const { limit, remaining, reset } = rateLimit;
  badge.classList.remove('hidden');

  // Calculate remaining time in minutes
  const timeDiff = reset - Date.now();
  const minsRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60)));

  let statusColor = 'text-green-400 border-green-500/30 bg-green-500/5';
  if (remaining < 15) {
    statusColor = 'text-amber-400 border-amber-500/30 bg-amber-500/5';
  }
  if (remaining === 0) {
    statusColor = 'text-red-400 border-red-500/30 bg-red-500/5';
  }

  badge.className = `flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-medium ${statusColor}`;
  badge.innerHTML = `
    <i data-lucide="gauge" class="w-3.5 h-3.5"></i>
    <span>Rate Limit: <b>${remaining}</b> / ${limit}</span>
    ${remaining < limit ? `<span class="text-slate-500 ml-1">(Resets in ${minsRemaining}m)</span>` : ''}
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
  displayWrapper.classList.add('hidden');
  errorContainer.classList.remove('hidden');

  let title = 'Oops! Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let icon = 'alert-triangle';
  let color = 'text-rose-400 border-rose-500/30 bg-rose-500/5';

  if (type === 'USER_NOT_FOUND') {
    title = 'User Not Found';
    message = 'The username you searched for does not exist on GitHub. Please check the spelling and try again.';
    icon = 'user-x';
    color = 'text-amber-400 border-amber-500/30 bg-amber-500/5';
  } else if (type === 'INVALID_TOKEN') {
    title = 'Invalid API Token';
    message = 'The GitHub Personal Access Token in your .env file is invalid or expired. Please check your token format and permissions.';
    icon = 'shield-alert';
    color = 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  } else if (type === 'FORBIDDEN') {
    title = 'Access Forbidden';
    message = 'The request was forbidden. If you are using a Personal Access Token, ensure it has the correct permissions.';
    icon = 'shield-off';
    color = 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  } else if (type === 'API_RATE_LIMIT_EXCEEDED') {
    title = 'Rate Limit Exceeded';
    message = 'GitHub API Rate Limit has been exceeded. Please check back later or set up a Personal Access Token.';
    icon = 'hourglass';
    color = 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  } else if (type === 'NETWORK_ERROR') {
    title = 'Network Connection Error';
    message = 'Unable to connect to GitHub. Please check your internet connection and try again.';
    icon = 'wifi-off';
    color = 'text-red-400 border-red-500/30 bg-red-500/5';
  } else if (type && type.startsWith('HTTP_ERROR_')) {
    const statusCode = type.replace('HTTP_ERROR_', '');
    title = `HTTP Error ${statusCode}`;
    message = `GitHub API returned an error status code ${statusCode}. Please try again later.`;
    icon = 'alert-circle';
    color = 'text-rose-400 border-rose-500/30 bg-rose-500/5';
  }

  errorContainer.innerHTML = `
    <div class="glass-panel max-w-xl mx-auto rounded-2xl p-8 border ${color} flex flex-col items-center text-center transition-all-300">
      <div class="p-3.5 rounded-full bg-slate-800/80 mb-4 border border-slate-700/30">
        <i data-lucide="${icon}" class="w-8 h-8"></i>
      </div>
      <h3 class="text-lg font-bold mb-2">${title}</h3>
      <p class="text-slate-400 text-sm max-w-md">${message}</p>
    </div>
  `;

  lucide.createIcons();
}

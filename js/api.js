const BASE_URL = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env?.VITE_GITHUB_TOKEN || (typeof localStorage !== 'undefined' ? localStorage.getItem('GITHUB_TOKEN') : null);

console.log('GitHub API Config:', {
  hasToken: !!GITHUB_TOKEN,
  tokenPrefix: GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 15) : 'none',
  tokenLength: GITHUB_TOKEN ? GITHUB_TOKEN.length : 0
});

/**
 * Helper to fetch data from GitHub API.
 * Handles headers, rate limits, and throws standard error strings.
 */
async function githubFetch(endpoint) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {})
    }
  };

  try {
    const response = await fetch(url, options);

    // Dynamic rate limit capturing from response headers
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (limit && remaining) {
      window.dispatchEvent(new CustomEvent('github-rate-limit-updated', {
        detail: {
          limit: parseInt(limit, 10),
          remaining: parseInt(remaining, 10),
          reset: parseInt(reset, 10) * 1000 // Convert to milliseconds
        }
      }));
    }

    if (response.status === 401) {
      throw new Error('INVALID_TOKEN');
    }

    if (response.status === 403) {
      if (remaining === '0') {
        throw new Error('API_RATE_LIMIT_EXCEEDED');
      }
      throw new Error('FORBIDDEN');
    }

    if (response.status === 404) {
      throw new Error('USER_NOT_FOUND');
    }

    if (!response.ok) {
      throw new Error(`HTTP_ERROR_${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (
      error.message === 'API_RATE_LIMIT_EXCEEDED' ||
      error.message === 'USER_NOT_FOUND' ||
      error.message === 'INVALID_TOKEN' ||
      error.message === 'FORBIDDEN' ||
      error.message.startsWith('HTTP_ERROR_')
    ) {
      throw error;
    }
    // Any other error (like CORS, offline, failed to fetch) is treated as a Network Error
    throw new Error('NETWORK_ERROR');
  }
}

/**
 * Fetch GitHub user profile details
 * @param {string} username 
 */
export async function getUser(username) {
  return githubFetch(`/users/${username}`);
}

/**
 * Fetch repositories of a GitHub user
 * @param {string} username 
 */
export async function getRepos(username) {
  // Query up to 100 repositories
  return githubFetch(`/users/${username}/repos?per_page=100`);
}

/**
 * Fetch the current rate limit status
 */
export async function getRateLimit() {
  try {
    const data = await githubFetch('/rate_limit');
    return data.resources.core;
  } catch (error) {
    // If it fails for rate limit, let it throw, otherwise return null
    if (error.message === 'API_RATE_LIMIT_EXCEEDED') {
      throw error;
    }
    return null;
  }
}

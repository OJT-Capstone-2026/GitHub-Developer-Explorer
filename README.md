# GitHub-Developer-Explorer

A premium, highly interactive dashboard that allows you to search for any GitHub developer and analyze their profile metadata, repositories, and programming language breakdown. 

Built with pure **HTML**, **CSS**, **Tailwind CSS**, **Vanilla JavaScript**, and the **GitHub REST API**. Served locally via **Vite** to support `.env` loading and ES module bundling.

---

## 🚀 Features

- **Developer Profile Search**: Fetches real-time profile avatar, bio, follower count, locations, blog links, and join date.
- **Repository List**: Displays repository descriptions, stars, forks, size metrics, and last-updated times.
- **Real-Time Repo Filter**: Live-search through repository names, descriptions, or languages instantly.
- **Multi-Sort controls**: Sort repositories dynamically by **Stars** (descending), **Name** (alphabetical), or **Last Updated** (newest first).
- **Language Breakdown**: Compiles primary repository languages and renders an interactive **Chart.js** doughnut chart and progress bars.
- **Rate Limit Indicator**: Continuously displays remaining GitHub API rate limits in the header.
- **Skeleton Pulse Loader**: Premium, pulsing visual skeleton components display while API calls load.
- **Error Handling**: Graceful cards handling non-existent usernames, rate limit exhaustion, and offline network disruptions.

---

## 🛠️ Tech Stack

- **Structure**: HTML5 Semantic markup
- **Styles**: Tailwind CSS (loaded via CDN) & Custom CSS (Glassmorphism & animations)
- **Charts**: Chart.js
- **Icons**: Lucide Icons
- **Logic**: Vanilla ES Modules (JS)
- **Development Server**: Vite (handles ESM and `.env` loading)

---

## 📂 Project Structure

```text
GitHub-Developer-Explorer/
│
├── .env                  # API Key Token Configuration (ignored by git)
├── .gitignore            # Git exclusions
├── index.html            # Entry HTML index
├── package.json          # Vite scripts & devDependencies
│
├── css/
│   └── style.css         # Animations, scrolls, and glass panels
│
├── js/
│   ├── api.js            # GitHub REST API integrations
│   ├── ui.js             # DOM manipulation & Chart rendering
│   └── app.js            # Main controller and state management
│
└── README.md             # Project documentation
```

---

## 💻 Local Setup Guide

### 1. Prerequisites

Ensure you have **Node.js** and **npm** installed:
```bash
node -v
npm -v
```

### 2. Install Dependencies

Install Vite (the local dev server):
```bash
npm install
```

### 3. Setup Environment Variables

The project loads the GitHub personal access token from a `.env` file in the root directory. To run with higher rate limits (up to 5,000 queries per hour), create a `.env` file:
```env
VITE_GITHUB_TOKEN=your_token_here
```

*(Note: The token is git-ignored via `.gitignore` to keep it safe during development).*

### 4. Start Development Server

Run the local server:
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Build for Production

To create a static production bundle:
```bash
npm run build
```
The output will compile to the `/dist` directory.

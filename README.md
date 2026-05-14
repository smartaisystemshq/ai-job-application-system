# AI Job Application System
**by Smart AI Systems**

A React + Vite web application that uses Claude AI to optimise CVs, generate cover letters, prep for interviews, and track job applications — all in a clean dark-themed UI.

---

## Features

| Section | What it does |
|---|---|
| **Dashboard** | Track applications (Company, Role, Status, Date, Notes). Add/edit/delete. Auto-saves to localStorage. |
| **CV Optimizer** | Paste your CV + job description → AI rewrites your CV to be ATS-optimised and keyword-matched |
| **Cover Letter** | Paste CV + job description → AI writes a <250 word, human-tone cover letter with no clichés |
| **Interview Prep** | Paste job description → AI generates 8 likely questions with answer frameworks |

---

## Deploy to Vercel (5 minutes)

### Prerequisites
- A [Vercel](https://vercel.com) account (free tier works)
- An [Anthropic API key](https://console.anthropic.com)
- [Node.js](https://nodejs.org) 18+ and [Git](https://git-scm.com) installed

### Step 1 — Install dependencies

```bash
cd ai-job-application-system
npm install
```

### Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new GitHub repo, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-job-application-system.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel auto-detects the **Vite** framework — no build settings needed
4. In **Environment Variables**, add:
   - **Key:** `ANTHROPIC_API_KEY`
   - **Value:** your Anthropic API key (starts with `sk-ant-...`)
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app` within ~2 minutes.

---

## Local Development

```bash
# Install Vercel CLI globally (first time only)
npm install -g vercel

# Create a local env file
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local

# Run locally with Vercel dev (required for AI features)
vercel dev
```

The app will be available at `http://localhost:3000`.

> **Note:** `npm run dev` starts the Vite dev server only — AI features won't work without the API functions. Use `vercel dev` to run the full app locally including serverless functions.

---

## Project Structure

```
ai-job-application-system/
├── api/
│   ├── optimize-cv.js            # CV optimization endpoint
│   ├── generate-cover-letter.js  # Cover letter endpoint
│   └── interview-prep.js         # Interview questions endpoint
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Dashboard.jsx
│   │   ├── CVOptimizer.jsx
│   │   ├── CoverLetterGenerator.jsx
│   │   └── InterviewPrep.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

---

## Security

The Anthropic API key is stored as a Vercel environment variable and **never exposed to the browser**. All Claude API calls go through the `/api/` serverless functions server-side.

---

## Customisation

- **Model:** Change `claude-sonnet-4-20250514` in any `/api/*.js` file
- **Prompts:** Edit the prompt strings in the API files to adjust tone, length, or style
- **Colours:** Change `--accent: #1D9E75` in `src/index.css` to re-theme instantly
- **Branding:** Update "Smart AI Systems" in `src/components/Header.jsx`

---

## Important Notes

- **Vercel Hobby plan** limits serverless function duration to **10 seconds**. For best results, use the **Pro plan** (60s timeout configured in `vercel.json`). If using Hobby, shorter CV/JD inputs will work more reliably.
- Dashboard data is stored in the user's browser `localStorage` — it persists between sessions but is device-specific.

---

## Tech Stack

- **Frontend:** React 18 + Vite, CSS variables, localStorage
- **Backend:** Vercel Serverless Functions (Node.js)
- **AI:** Anthropic Claude (`claude-sonnet-4-20250514`)
- **Hosting:** Vercel

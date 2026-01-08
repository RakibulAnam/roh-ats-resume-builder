# Deploying to Vercel

This guide explains how to host your **Roh ATS Resume Builder** on [Vercel](https://vercel.com).

## Prerequisites
- A [GitHub](https://github.com), [GitLab](https://gitlab.com), or [Bitbucket](https://bitbucket.org) account.
- A [Vercel](https://vercel.com) account.

## Method 1: Git Integration (Recommended)

1. **Push your code to a Git repository.**
   - If haven't already initialized git:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     ```
   - Create a new repository on GitHub/GitLab/Bitbucket and push your code there.

2. **Connect to Vercel.**
   - Go to your [Vercel Dashboard](https://vercel.com/dashboard).
   - Click **"Add New..."** > **"Project"**.
   - Select your Git repository from the list (you may need to install the Vercel app on your Git account first).

3. **Configure Project Settings.**
   - Vercel will automatically detect that this is a **Vite** project.
   - **Build Command**: `vite build` (Default is correct)
   - **Output Directory**: `dist` (Default is correct)

4. **Environment Variables (Important)**
   - Expand the **"Environment Variables"** section.
   - Add the following variable (copy from your `.env` or `.env.local`):
     - Name: `VITE_GEMINI_API_KEY`
     - Value: `your_actual_api_key_here`

5. **Deploy.**
   - Click **"Deploy"**.
   - Wait for the build to complete. Vercel will provide you with a live URL (e.g., `roh-ats-resume-builder.vercel.app`).

## Method 2: Vercel CLI (Quickest for one-off)

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   Run the following command in your project root:
   ```bash
   vercel
   ```
   - Follow the prompts (Select scope, link to existing project: No, etc.)
   - When asked "Want to override the settings?", usually saying **No** is fine as it detects Vite.
   - **Note**: You will still need to add the Environment Variable in the Vercel Dashboard after the first deployment, or configure it via CLI.

## Troubleshooting

- **404 on Refresh**: I have added a `vercel.json` file to the project to handle Single Page Application (SPA) routing, so refreshing pages should work correctly.
- **API Errors**: Ensure `VITE_GEMINI_API_KEY` is set correctly in the Vercel Project Settings.

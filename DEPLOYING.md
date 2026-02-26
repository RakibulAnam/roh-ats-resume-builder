# Deploying ATS Resume Builder to Vercel

This guide provides step-by-step instructions to deploy the **Roh ATS Resume Builder** to production using [Vercel](https://vercel.com).

## Prerequisites
- **Vercel Account**: [Sign up here](https://vercel.com/signup).
- **Supabase Account**: [Sign up here](https://supabase.com).
- **Google AI Studio (Gemini API)**: [Get API Key](https://aistudio.google.com/app/apikey).
- **GitHub Repository**: Your code should be pushed to a GitHub repository.

---

## Step 1: Set up Supabase (Backend)
The application requires a PostgreSQL database and Authentication provided by Supabase.

1.  **Create a Project**:
    - Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
    - Note down your **Project URL** and **Anon Key** (API Key).

2.  **Authentication**:
    - Go to **Authentication** > **Providers**.
    - Ensure **Email/Password** is enabled.

3.  **Database Setup**:
    - Go to the **SQL Editor** in your Supabase Dashboard.
    - Open the file `supabase/schema.sql` from this repository.
    - Copy the entire content of `schema.sql` and paste it into the Supabase SQL Editor.
    - Click **Run** to create all necessary tables and security policies (RLS).

---

## Step 2: Deploy to Vercel (Frontend)

1.  **Import Project**:
    - Go to your [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **"Add New..."** > **"Project"**.
    - Select your GitHub repository (`roh-ats-resume-builder`).

2.  **Configure Build Settings**:
    - **Framework Preset**: Vite (Vercel should detect this automatically).
    - **Root Directory**: `./` (default).
    - **Build Command**: `vite build` (default).
    - **Output Directory**: `dist` (default).

3.  **Environment Variables**:
    - Expand the **"Environment Variables"** section.
    - Add the following variables (copy values from your `.env` or Supabase/Google dashboards):

    | Name | Value Source | Description |
    |------|--------------|-------------|
    | `VITE_SUPABASE_URL` | Supabase Dashboard | Project URL (under Project Settings > API) |
    | `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard | Project API Anon Key (under Project Settings > API) |
    | `VITE_GEMINI_API_KEY` | Google AI Studio | Your Gemini API Key Used for AI optimization |

4.  **Deploy**:
    - Click **"Deploy"**.
    - Wait for the build to complete.
    - Vercel will provide a live URL (e.g., `https://your-project.vercel.app`).

---

## Step 3: Verify Deployment
1.  Open your deployed URL.
2.  **Sign Up**: Create a new account.
3.  **Check Database**: Verify in Supabase Table Editor that a new user profile was created in the `profiles` table.
4.  **Test AI**: Try creating a resume and optimizing it to ensure the Gemini API key is working.

## Troubleshooting

- **"Invalid Date" on Dashboard**: This usually happens if the backend date is not format-agnostic. We fixed this by using ISO strings, but if it persists, check your browser locale.
- **AI Not Responding**: Check if `VITE_GEMINI_API_KEY` is correctly set in Vercel Environment Variables.
- **Database Errors**: Ensure you ran the full `schema.sql` script. If RLS policies are missing, you might verify but not see or save data.

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

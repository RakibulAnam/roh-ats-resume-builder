
# ATS Resume Builder - Context & Architecture

## Project Overview
**Name**: `roh-ats-resume-builder`
**Purpose**: An AI-powered resume builder that optimizes resume content for ATS (Applicant Tracking Systems) using Google Gemini, and exports to Word/PDF.
**Tech Stack**:
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS
- **State Management**: React Context (`AuthContext`) & Local State
- **AI**: Google Gemini (`@google/genai`)
- **Backend/Auth**: Supabase
- **Export**: `docx` (Word), `jspdf` (PDF implementation tbc)
- **UI Components**: `lucide-react` (icons), `sonner` (toasts)

## Architecture
The project follows **Clean Architecture** principles, separating concerns into distinct layers:

### 1. Domain Layer (`src/domain/`)
*Pure business logic, no external dependencies.*
- **Entities** (`src/domain/entities/`):
  - `Resume.ts`: Core data models including `ResumeData`, `WorkExperience`, `Education`, `Project`, etc.
  - `AppStep.ts`: Enum for application wizard steps.
- **Use Cases** (`src/domain/usecases/`):
  - `OptimizeResumeUseCase.ts`: Logic for refining resume content.
  - `ExportResumeUseCase.ts`: Logic for document generation.
  - `GenerateCoverLetterUseCase.ts`: Logic for cover letter creation.

### 2. Application Layer (`src/application/`)
*Orchestration of use cases.*
- **Services** (`src/application/services/`):
  - `ResumeService.ts`: The main entry point for the UI. It coordinates the optimizer, exporter, and repositories. It handles:
    - Saving/Loading drafts.
    - Generating resumes via AI.
    - Exporting to Word/PDF.
    - Managing generated resumes in Supabase.

### 3. Infrastructure Layer (`src/infrastructure/`)
*Implementation of external services and repositories.*
- **Repositories** (`src/infrastructure/repositories/`):
  - `LocalStorageResumeRepository.ts`: Saves in-progress drafts to browser `localStorage` (`resume_draft`).
  - `SupabaseResumeRepository.ts`: Saves finalized/generated resumes to Supabase (`generated_resumes` table).
  - `SupabaseProfileRepository.ts`: Manages user profiles.
- **AI** (`src/infrastructure/ai/`): `GeminiResumeOptimizer.ts` implements `IResumeOptimizer`.
- **Auth** (`src/infrastructure/auth/`): `AuthContext.tsx` wraps Supabase Auth.
- **Config** (`src/infrastructure/config/`): `dependencies.ts` for Dependency Injection.

### 4. Presentation Layer (`src/presentation/`)
*UI components and views.*
- **App.tsx**: Main controller. Manages the wizard state (`step`, `resumeData`), user authentication check, and navigation.
- **Components** (`src/presentation/components/`):
  - `FormSteps/`: Individual steps for the resume builder (Experience, Education, etc.).
  - `Preview.tsx`: Real-time preview of the resume.
  - `Layout/`: Navbar and shared layout components.
- **Screens**: `DashboardScreen`, `LoginScreen`, `LandingScreen`, `ProfileScreen`.

## Key Data Models (`src/domain/entities/Resume.ts`)
- **`ResumeData`**: The aggregate root containing:
  - `personalInfo`: Contact details.
  - `targetJob`: The job description the user is applying for (critical for AI optimization).
  - `experience`: Array of work experiences with `rawDescription` (user input) and `refinedBullets` (AI output).
  - `projects`, `education`, `skills`: Standard resume sections.
  - `userType`: `'experienced'` vs `'student'` (determines visible sections).

## Data Flow
1. **User Input**: User fills out forms in `FormSteps`. Data is stored in `App.tsx` state.
2. **Draft Saving**: `ResumeService.saveDraft()` persists state to `localStorage`.
3. **AI Optimization**: User clicks "Generate". `ResumeService.optimizeResume()` calls `GeminiResumeOptimizer` to generate `refinedBullets` and `summary` based on `targetJob`.
4. **Final Save**: `ResumeService.saveGeneratedResume()` saves the optimized resume to Supabase.
5. **Export**: User downloads Word/PDF via `ResumeService.exportToWord()`.

## Environment Variables
- `VITE_GEMINI_API_KEY`: API key for Google Gemini.
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous public key.

## Scripts
- `npm run dev`: Start Vite dev server.
- `npm run build`: Build for production.
- `npm run preview`: Preview production build.

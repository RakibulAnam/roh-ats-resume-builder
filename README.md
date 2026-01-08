# ATS Resume Builder

An AI-powered resume builder that optimizes your CV for Applicant Tracking Systems (ATS) based on specific job descriptions.

## Architecture

This application follows **Clean Architecture** principles, organized into distinct layers:

```
src/
├── domain/              # Core business logic (entities, use cases)
│   ├── entities/        # Domain models (Resume, AppStep)
│   └── usecases/        # Business use cases (OptimizeResume, ExportResume)
├── application/          # Application services (orchestrates use cases)
│   └── services/        # Application-level services
├── infrastructure/      # External dependencies (AI, file export)
│   ├── ai/             # Gemini AI implementation
│   ├── export/         # Word/PDF export implementations
│   └── config/         # Dependency injection
└── presentation/        # UI layer (React components)
    ├── components/     # React components
    └── App.tsx         # Main app component
```

### Architecture Principles

- **Domain Layer**: Contains pure business logic, independent of frameworks
- **Application Layer**: Orchestrates use cases and coordinates domain objects
- **Infrastructure Layer**: Implements external services (AI, file I/O)
- **Presentation Layer**: React UI components that interact with application services

### Key Benefits

- **Separation of Concerns**: Each layer has a clear responsibility
- **Testability**: Business logic can be tested independently
- **Maintainability**: Changes in one layer don't affect others
- **Flexibility**: Easy to swap implementations (e.g., different AI providers)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   
   Or copy the example file:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your Gemini API key.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Usage

1. **Start Building**: Click "Start Building" on the landing page
2. **Enter Target Job**: Paste the job description you're applying for
3. **Fill Personal Info**: Enter your contact information
4. **Add Experience**: List your work history with achievements
5. **Add Education**: Include your academic background
6. **Add Skills**: List your technical and soft skills
7. **Generate Resume**: AI will optimize your resume for the target job
8. **Export**: Download as Word document or PDF

## Project Structure

### Domain Layer (`src/domain/`)

- **Entities**: Core data models (`Resume.ts`, `AppStep.ts`)
- **Use Cases**: Business logic operations
  - `OptimizeResumeUseCase`: Optimizes resume using AI
  - `ExportResumeUseCase`: Handles resume export operations

### Application Layer (`src/application/`)

- **Services**: Application services that coordinate use cases
  - `ResumeService`: Main service orchestrating resume operations

### Infrastructure Layer (`src/infrastructure/`)

- **AI**: `GeminiResumeOptimizer` - Implements resume optimization using Gemini AI
- **Export**: `WordResumeExporter` - Handles Word document generation
- **Config**: Dependency injection container

### Presentation Layer (`src/presentation/`)

- **Components**: React UI components
  - `FormSteps`: Multi-step form components
  - `Preview`: Resume preview and export UI
- **App.tsx**: Main application component

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Your Google Gemini API key | Yes |

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Technologies

- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Google Gemini 2.5 Flash**: AI for resume optimization
- **docx**: Word document generation
- **Tailwind CSS**: Styling (via CDN)

## Development

The application uses Vite for development. The entry point is `src/index.tsx`, which renders the main `App` component.

### Key Features

- **Clean Architecture**: Separation of concerns across layers
- **Type Safety**: Full TypeScript support
- **Dependency Injection**: Centralized dependency management
- **Error Handling**: Comprehensive error handling at each layer

## License

MIT

# Clean Architecture Overview

This document describes the Clean Architecture implementation of the ATS Resume Builder application.

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

The innermost layer containing pure business logic, independent of frameworks and external concerns.

#### Entities (`src/domain/entities/`)
- **Resume.ts**: Core domain models
  - `ResumeData`: Complete resume data structure
  - `PersonalInfo`: Contact information
  - `WorkExperience`: Work history entries
  - `Education`: Educational background
  - `TargetJob`: Target job information
  - `OptimizedResumeData`: AI-optimized resume data
- **AppStep.ts**: Application step enumeration

#### Use Cases (`src/domain/usecases/`)
- **OptimizeResumeUseCase.ts**: 
  - Interface: `IResumeOptimizer`
  - Business logic for resume optimization
  - Validates input before optimization
- **ExportResumeUseCase.ts**:
  - Interface: `IResumeExporter`
  - Business logic for resume export
  - Validates data before export

### 2. Application Layer (`src/application/`)

Orchestrates use cases and coordinates domain objects. Contains application-specific business logic.

#### Services (`src/application/services/`)
- **ResumeService.ts**: 
  - Coordinates resume optimization and export operations
  - Merges optimized data with original data
  - Acts as a facade for use cases

### 3. Infrastructure Layer (`src/infrastructure/`)

Implements external services and frameworks. Contains concrete implementations of domain interfaces.

#### AI (`src/infrastructure/ai/`)
- **GeminiResumeOptimizer.ts**: 
  - Implements `IResumeOptimizer`
  - Handles communication with Google Gemini API
  - Transforms domain models to API format

#### Export (`src/infrastructure/export/`)
- **WordResumeExporter.ts**: 
  - Implements `IResumeExporter`
  - Generates Word documents using `docx` library
  - Formats resume data for document generation

#### Config (`src/infrastructure/config/`)
- **dependencies.ts**: 
  - Dependency injection container
  - Initializes services with their dependencies
  - Manages environment variable access

### 4. Presentation Layer (`src/presentation/`)

UI components and user interaction logic. Depends on application layer.

#### Components (`src/presentation/components/`)
- **FormSteps.tsx**: Multi-step form components
  - `TargetJobStep`: Job description input
  - `PersonalInfoStep`: Contact information
  - `ExperienceStep`: Work history
  - `EducationStep`: Education background
  - `SkillsStep`: Skills input
- **Preview.tsx**: Resume preview and export UI

#### App (`src/presentation/App.tsx`)
- Main application component
- Manages application state
- Coordinates between components and services
- Handles user interactions

## Dependency Flow

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ←────┘
```

- **Presentation** depends on **Application** and **Domain**
- **Application** depends on **Domain**
- **Infrastructure** implements **Domain** interfaces
- **Domain** has no dependencies (pure business logic)

## Key Design Patterns

### 1. Dependency Inversion
- Domain defines interfaces (`IResumeOptimizer`, `IResumeExporter`)
- Infrastructure implements these interfaces
- Application uses interfaces, not concrete implementations

### 2. Use Case Pattern
- Each business operation is encapsulated in a use case
- Use cases validate input and coordinate domain logic
- Clear separation of concerns

### 3. Service Layer
- Application services orchestrate multiple use cases
- Provides a clean API for presentation layer
- Handles data transformation between layers

### 4. Dependency Injection
- Dependencies are injected via constructor
- Centralized dependency management in `dependencies.ts`
- Easy to swap implementations for testing

## Benefits

1. **Testability**: Each layer can be tested independently
2. **Maintainability**: Changes are isolated to specific layers
3. **Flexibility**: Easy to swap implementations (e.g., different AI providers)
4. **Scalability**: Clear structure supports growth
5. **Independence**: Business logic is independent of frameworks

## Adding New Features

### Adding a New Use Case

1. Define interface in `src/domain/usecases/`
2. Create use case class implementing business logic
3. Implement interface in `src/infrastructure/`
4. Add service method in `src/application/services/`
5. Use service in presentation layer

### Adding a New External Service

1. Define interface in domain layer
2. Implement interface in infrastructure layer
3. Register in dependency injection container
4. Use via application service

## Environment Configuration

Environment variables are accessed through the infrastructure layer:
- `VITE_GEMINI_API_KEY`: Required for Gemini AI service
- Variables must be prefixed with `VITE_` for Vite to expose them

## File Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Resume.ts
│   │   ├── AppStep.ts
│   │   └── index.ts
│   └── usecases/
│       ├── OptimizeResumeUseCase.ts
│       └── ExportResumeUseCase.ts
├── application/
│   └── services/
│       └── ResumeService.ts
├── infrastructure/
│   ├── ai/
│   │   └── GeminiResumeOptimizer.ts
│   ├── export/
│   │   └── WordResumeExporter.ts
│   └── config/
│       └── dependencies.ts
└── presentation/
    ├── components/
    │   ├── FormSteps.tsx
    │   └── Preview.tsx
    └── App.tsx
```


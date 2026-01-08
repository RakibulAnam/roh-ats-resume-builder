// Domain Entities - Core business objects

export type UserType = 'experienced' | 'student';

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  rawDescription: string; // User input
  refinedBullets: string[]; // AI Generated
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa?: string; // Optional GPA/CGPA (e.g., "3.8/4.0" or "8.5/10")
}

export interface TargetJob {
  title: string;
  company: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link?: string;
}

export interface ResumeData {
  userType?: UserType; // User type: experienced or student
  targetJob: TargetJob;
  personalInfo: PersonalInfo;
  summary: string; // AI Generated
  experience: WorkExperience[];
  projects: Project[]; // Added Projects
  education: Education[];
  skills: string[]; // User input -> AI Refined
  coverLetter?: string; // AI Generated cover letter
  customSections?: { title: string; items: string[] }[];
}

export interface OptimizedResumeData {
  summary: string;
  skills: string[];
  experience: {
    id: string;
    refinedBullets: string[];
  }[];
  coverLetter?: string; // AI Generated cover letter
}


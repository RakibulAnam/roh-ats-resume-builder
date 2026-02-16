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
  rawDescription: string;
  refinedBullets: string[];
  technologies: string;
  link?: string;
}


export interface Extracurricular {
  id: string;
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string; // raw description
  refinedBullets: string[]; // AI refined
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface Affiliation {
  id: string;
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
}

export interface Publication {
  id: string;
  title: string;
  publisher?: string;
  date: string;
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

  // New Sections
  extracurriculars?: Extracurricular[];
  awards?: Award[];
  certifications?: Certification[];
  affiliations?: Affiliation[];
  publications?: Publication[];

  coverLetter?: string; // AI Generated cover letter
  customSections?: { title: string; items: string[] }[];
  visibleSections?: string[]; // User selected sections
}

export interface OptimizedResumeData {
  summary: string;
  skills: string[];
  experience: {
    id: string;
    refinedBullets: string[];
  }[];
  projects?: {
    id: string;
    refinedBullets: string[];
  }[];
  extracurriculars?: {
    id: string;
    refinedBullets: string[];
  }[];
  coverLetter?: string; // AI Generated cover letter
}


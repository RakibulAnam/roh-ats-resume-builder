// Presentation Layer - Form Components

import React, { useState, useEffect } from 'react';
import {
  PersonalInfo,
  WorkExperience,
  Education,
  TargetJob,
  UserType,
  Project,
  Extracurricular,
  Award,
  Certification,
  Affiliation,
  Publication
} from '../../domain/entities/Resume';
import { Plus, Trash2, Briefcase, GraduationCap, FolderGit2, Calendar, Award as AwardIcon, BookOpen, Users } from 'lucide-react';
import { MonthPicker } from './ui/month-picker';

// --- Shared UI ---
const InputGroup = ({
  label,
  error,
  children,
  className = '',
}: {
  label: string;
  error?: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-charcoal-700">{label}</label>
    {children}
    {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
  </div>
);

type InputProps = React.ComponentProps<'input'> & {
  error?: string;
};

const Input = ({ error, className, ...props }: InputProps) => (
  <input
    {...props}
    aria-invalid={!!error}
    className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-charcoal-900 focus:outline-none focus-visible:ring-2 transition-colors disabled:bg-charcoal-100 disabled:text-charcoal-400 ${error
      ? 'border-red-500 focus-visible:ring-red-500'
      : 'border-charcoal-300 focus-visible:ring-brand-500 focus-visible:border-transparent'
      } ${className || ''}`}
  />
);

type TextAreaProps = React.ComponentProps<'textarea'> & {
  error?: string;
};

const TextArea = ({ error, className, ...props }: TextAreaProps) => (
  <textarea
    {...props}
    aria-invalid={!!error}
    className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-charcoal-900 focus:outline-none focus-visible:ring-2 transition-colors ${error
      ? 'border-red-500 focus-visible:ring-red-500'
      : 'border-charcoal-300 focus-visible:ring-brand-500 focus-visible:border-transparent'
      } ${className || ''}`}
  />
);

const SectionTitle = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-charcoal-900">{title}</h2>
    <p className="text-charcoal-500 mt-1">{desc}</p>
  </div>
);

// --- Steps ---

export const UserTypeStep: React.FC<{
  userType?: UserType;
  update: (userType: UserType) => void;
}> = ({ userType, update }) => {
  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Tell us about yourself"
        desc="Are you an experienced professional or a student looking for your first opportunity?"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <button
          onClick={() => update('experienced')}
          className={`p-8 border-2 rounded-xl transition-all text-left ${userType === 'experienced'
            ? 'border-brand-600 bg-brand-50 shadow-lg'
            : 'border-charcoal-200 hover:border-brand-300 hover:shadow-md'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'experienced'
              ? 'bg-brand-600 text-white'
              : 'bg-charcoal-100 text-charcoal-600'
              }`}>
              <Briefcase size={24} />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900">Experienced Professional</h3>
          </div>
          <p className="text-charcoal-600 text-sm">
            I have work experience to include on my resume
          </p>
        </button>

        <button
          onClick={() => update('student')}
          className={`p-8 border-2 rounded-xl transition-all text-left ${userType === 'student'
            ? 'border-brand-600 bg-brand-50 shadow-lg'
            : 'border-charcoal-200 hover:border-brand-300 hover:shadow-md'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'student'
              ? 'bg-brand-600 text-white'
              : 'bg-charcoal-100 text-charcoal-600'
              }`}>
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-charcoal-900">Student / Entry Level</h3>
          </div>
          <p className="text-charcoal-600 text-sm">
            I'm a student or recent graduate with no work experience
          </p>
        </button>
      </div>
    </div>
  );
};

export const TargetJobStep: React.FC<{
  data: TargetJob;
  update: (d: TargetJob) => void;
}> = ({ data, update }) => (
  <div className="animate-fade-in">
    <SectionTitle
      title="Target Job"
      desc="Paste the job description you are applying for. Our AI will analyze this."
    />
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputGroup label="Job Title">
          <Input
            placeholder="e.g. Marketing Manager, Registered Nurse, Financial Analyst"
            value={data.title}
            onChange={e => update({ ...data, title: e.target.value })}
          />
        </InputGroup>
        <InputGroup label="Company / Organization">
          <Input
            placeholder="e.g. Acme Inc., Mayo Clinic, Pearson"
            value={data.company}
            onChange={e => update({ ...data, company: e.target.value })}
          />
        </InputGroup>
      </div>
      <InputGroup label="Job Description">
        <TextArea
          rows={10}
          placeholder="Paste the full job description here..."
          value={data.description}
          onChange={e => update({ ...data, description: e.target.value })}
        />
      </InputGroup>
    </div>
  </div>
);

export const PersonalInfoStep: React.FC<{
  data: PersonalInfo;
  errors?: Record<string, string>;
  update: (d: PersonalInfo) => void;
}> = ({ data, errors, update }) => (
  <div className="animate-fade-in">
    <SectionTitle
      title="Personal Info"
      desc="How can recruiters contact you?"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputGroup label="Full Name" error={errors?.['personalInfo.fullName']}>
        <Input
          error={errors?.['personalInfo.fullName']}
          value={data.fullName}
          onChange={e => update({ ...data, fullName: e.target.value })}
          placeholder="John Doe"
          autoComplete="name"
        />
      </InputGroup>
      <InputGroup label="Email" error={errors?.['personalInfo.email']}>
        <Input
          error={errors?.['personalInfo.email']}
          type="email"
          value={data.email}
          onChange={e => update({ ...data, email: e.target.value })}
          placeholder="john@example.com"
          autoComplete="email"
        />
      </InputGroup>
      <InputGroup label="Phone">
        <Input
          type="tel"
          value={data.phone}
          onChange={e => update({ ...data, phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />
      </InputGroup>
      <InputGroup label="Location">
        <Input
          value={data.location}
          onChange={e => update({ ...data, location: e.target.value })}
          placeholder="San Francisco, CA"
        />
      </InputGroup>
      <InputGroup label="LinkedIn URL (Optional)">
        <Input
          type="url"
          value={data.linkedin || ''}
          onChange={e => update({ ...data, linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/johndoe"
        />
      </InputGroup>
      <InputGroup label="GitHub / Code Portfolio (Optional)">
        <Input
          type="url"
          value={data.github || ''}
          onChange={e => update({ ...data, github: e.target.value })}
          placeholder="https://github.com/johndoe"
        />
      </InputGroup>
      <InputGroup label="Portfolio / Website (Optional)">
        <Input
          type="url"
          value={data.website || ''}
          onChange={e => update({ ...data, website: e.target.value })}
          placeholder="e.g. https://yourname.com or Behance / Dribbble / personal site"
        />
      </InputGroup>
    </div>
  </div>
);

export const ProjectsStep: React.FC<{
  data: Project[];
  errors?: Record<string, string>;
  update: (d: Project[]) => void;
}> = ({ data, errors, update }) => {
  const addProject = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        name: '',
        rawDescription: '',
        refinedBullets: [],
        technologies: '',
      },
    ]);
  };

  const removeProject = (id: string) => update(data.filter(p => p.id !== id));

  const updateProject = (id: string, field: keyof Project, value: any) => {
    update(data.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        title="Projects"
        desc="Showcase your work. Include capstone work, research studies, freelance or client projects, creative portfolios, campaigns, case studies, side projects, or volunteer initiatives — anything you planned, created, or delivered."
      />

      {data.map((project, index) => (
        <div
          key={project.id}
          className="p-4 border border-charcoal-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <div className="bg-orange-100 p-1.5 rounded-full text-orange-600">
                <FolderGit2 size={16} />
              </div>
              Project {index + 1}
            </h3>
            <button
              type="button"
              onClick={() => removeProject(project.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <InputGroup label="Project Name" error={errors?.[`projects.${index}.name`]}>
              <Input
                error={errors?.[`projects.${index}.name`]}
                value={project.name}
                onChange={e => updateProject(project.id, 'name', e.target.value)}
                placeholder="e.g. Brand Relaunch Campaign, Community Health Study, E-commerce Platform"
              />
            </InputGroup>

            <InputGroup label="Tools, Methods, or Technologies (Optional, comma separated)">
              <Input
                value={project.technologies || ''}
                onChange={e => updateProject(project.id, 'technologies', e.target.value)}
                placeholder="e.g. Figma & Adobe Suite • Qualitative interviews, SPSS • React, Node.js • Classroom observation, IEP planning"
              />
            </InputGroup>

            <InputGroup label="Link (Optional)">
              <Input
                type="url"
                value={project.link || ''}
                onChange={e => updateProject(project.id, 'link', e.target.value)}
                placeholder="e.g. https://yourportfolio.com/project, https://github.com/..., published article URL"
              />
            </InputGroup>

            <InputGroup label="Description (Brain dump your contribution — AI will refine)" error={errors?.[`projects.${index}.rawDescription`]}>
              <TextArea
                error={errors?.[`projects.${index}.rawDescription`]}
                rows={4}
                value={project.rawDescription}
                onChange={e => updateProject(project.id, 'rawDescription', e.target.value)}
                placeholder={`Describe what you created, delivered, or contributed to — your role, scope, and outcome. Examples:
- Led a 6-month rebrand; grew social engagement 40%.
- Designed K-5 literacy curriculum adopted district-wide.
- Conducted 20 patient interviews; published findings in department review.
- Built customer dashboard with React and Node.js reducing support tickets 30%.`}
              />
            </InputGroup>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addProject}
        className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg text-charcoal-500 hover:border-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={20} /> Add Project
      </button>
    </div>
  );
};

export const ExperienceStep: React.FC<{
  data: WorkExperience[];
  errors?: Record<string, string>;
  update: (d: WorkExperience[]) => void;
}> = ({ data, errors, update }) => {
  const addExp = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        company: '',
        role: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        rawDescription: '',
        refinedBullets: [],
      },
    ]);
  };

  const removeExp = (id: string) => {
    update(data.filter(exp => exp.id !== id));
  };

  const updateExp = (id: string, field: keyof WorkExperience, value: any) => {
    update(data.map(exp => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        title="Experience"
        desc="List your relevant work history. Focus on what you did."
      />

      {data.map((exp, index) => (
        <div
          key={exp.id}
          className="p-4 border border-charcoal-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <div className="bg-brand-100 p-1.5 rounded-full text-brand-600">
                <Briefcase size={16} />
              </div>
              Position {index + 1}
            </h3>
            <button
              type="button"
              onClick={() => removeExp(exp.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InputGroup label="Job Title" error={errors?.[`experience.${index}.role`]}>
              <Input
                error={errors?.[`experience.${index}.role`]}
                value={exp.role}
                onChange={e => updateExp(exp.id, 'role', e.target.value)}
                placeholder="e.g. Registered Nurse, Marketing Manager, Software Engineer"
              />
            </InputGroup>
            <InputGroup label="Company / Organization" error={errors?.[`experience.${index}.company`]}>
              <Input
                error={errors?.[`experience.${index}.company`]}
                value={exp.company}
                onChange={e => updateExp(exp.id, 'company', e.target.value)}
                placeholder="e.g. Mayo Clinic, Acme Corp, Oakwood High School"
              />
            </InputGroup>

            <InputGroup label="Start Date" error={errors?.[`experience.${index}.startDate`]}>
              <MonthPicker
                isError={!!errors?.[`experience.${index}.startDate`]}
                value={exp.startDate}
                onChange={val => updateExp(exp.id, 'startDate', val)}
              />
            </InputGroup>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-charcoal-700">
                End Date
              </label>
              <div className="flex flex-col gap-2">

                {exp.isCurrent ? (
                  <div className="w-full rounded-md border border-charcoal-200 bg-charcoal-50 px-3 py-2 text-sm text-charcoal-500 font-medium">
                    Present
                  </div>
                ) : (
                  <>
                    <MonthPicker
                      isError={!!errors?.[`experience.${index}.endDate`]}
                      value={exp.endDate}
                      onChange={val => updateExp(exp.id, 'endDate', val)}
                    />
                    {errors?.[`experience.${index}.endDate`] && <span className="text-xs text-red-500">{errors[`experience.${index}.endDate`]}</span>}
                  </>
                )}

                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-brand-600 rounded border-charcoal-300 focus-visible:ring-brand-500"
                    checked={exp.isCurrent}
                    onChange={e => {
                      const isCurrent = e.target.checked;
                      update(data.map(item =>
                        item.id === exp.id
                          ? { ...item, isCurrent, endDate: isCurrent ? '' : item.endDate }
                          : item
                      ));
                    }}
                  />
                  <span className={`text-sm font-medium ${exp.isCurrent ? 'text-brand-700' : 'text-charcoal-600'}`}>
                    I currently work here
                  </span>
                </label>
              </div>
            </div>
          </div>

          <InputGroup label="What did you do and achieve? (Brain dump — AI will refine)" error={errors?.[`experience.${index}.rawDescription`]}>
            <TextArea
              error={errors?.[`experience.${index}.rawDescription`]}
              rows={6}
              value={exp.rawDescription}
              onChange={e => updateExp(exp.id, 'rawDescription', e.target.value)}
              placeholder={`List your main responsibilities, achievements, and outcomes — include real numbers where you have them. The AI will shape them into strong resume bullets.

Examples from different fields:
- Led a team of 5 and shipped features that cut site load time 50%.
- Managed a caseload of 20+ patients across 3 units; reduced readmissions 15%.
- Designed lesson plans for 120 students; raised state assessment scores 12%.
- Closed $1.2M in new business; grew territory pipeline 35% YoY.
- Drafted contracts and motions for 30+ cases; reduced turnaround time by half.`}
            />
          </InputGroup>
        </div>
      ))}

      <button
        type="button"
        onClick={addExp}
        className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg text-charcoal-500 hover:border-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={20} /> Add Position
      </button>
    </div>
  );
};

export const EducationStep: React.FC<{
  data: Education[];
  errors?: Record<string, string>;
  update: (d: Education[]) => void;
}> = ({ data, errors, update }) => {
  const addEdu = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        school: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
      },
    ]);
  };

  const removeEdu = (id: string) => update(data.filter(e => e.id !== id));
  const updateEdu = (id: string, field: keyof Education, value: string) => {
    update(data.map(e => (e.id === id ? { ...e, [field]: value } : e)));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Education" desc="Your academic background." />

      {data.map((edu, index) => (
        <div
          key={edu.id}
          className="p-4 border border-charcoal-200 rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                <GraduationCap size={16} />
              </div>
              School {index + 1}
            </h3>
            <button
              type="button"
              onClick={() => removeEdu(edu.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="School / University" error={errors?.[`education.${index}.school`]}>
              <Input
                error={errors?.[`education.${index}.school`]}
                value={edu.school}
                onChange={e => updateEdu(edu.id, 'school', e.target.value)}
                placeholder="e.g. Stanford University, NYU, State University"
              />
            </InputGroup>
            <InputGroup label="Degree" error={errors?.[`education.${index}.degree`]}>
              <Input
                error={errors?.[`education.${index}.degree`]}
                value={edu.degree}
                onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                placeholder="e.g. Bachelor of Arts, BSN, MBA, High School Diploma"
              />
            </InputGroup>
            <InputGroup label="Field of Study" error={errors?.[`education.${index}.field`]}>
              <Input
                error={errors?.[`education.${index}.field`]}
                value={edu.field}
                onChange={e => updateEdu(edu.id, 'field', e.target.value)}
                placeholder="e.g. Nursing, Business, Education, Computer Science, Psychology"
              />
            </InputGroup>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Start Year" error={errors?.[`education.${index}.startDate`]}>
                <Input
                  error={errors?.[`education.${index}.startDate`]}
                  value={edu.startDate}
                  onChange={e => updateEdu(edu.id, 'startDate', e.target.value)}
                  placeholder="2018"
                />
              </InputGroup>
              <InputGroup label="End Year" error={errors?.[`education.${index}.endDate`]}>
                <Input
                  error={errors?.[`education.${index}.endDate`]}
                  value={edu.endDate}
                  onChange={e => updateEdu(edu.id, 'endDate', e.target.value)}
                  placeholder="2022"
                />
              </InputGroup>
            </div>
            <InputGroup label="GPA/CGPA (Optional)">
              <Input
                value={edu.gpa || ''}
                onChange={e => updateEdu(edu.id, 'gpa', e.target.value)}
                placeholder="e.g., 3.8/4.0 or 8.5/10"
              />
            </InputGroup>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEdu}
        className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg text-charcoal-500 hover:border-brand-500 hover:text-brand-600 font-medium flex items-center justify-center gap-2 transition-colors"
      >

        <Plus size={20} /> Add Education
      </button>
    </div>
  );
};

export const SkillsStep: React.FC<{
  data: string[];
  update: (d: string[]) => void;
}> = ({ data, update }) => {
  const [currentSkill, setCurrentSkill] = useState('');

  const addSkill = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentSkill.trim()) return;
    if (!data.includes(currentSkill.trim())) {
      update([...data, currentSkill.trim()]);
    }
    setCurrentSkill('');
  };

  const removeSkill = (skill: string) => {
    update(data.filter(s => s !== skill));
  };

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Skills"
        desc="List hard skills (tools, methods, certifications, languages) and soft skills (leadership, communication). The AI prioritizes skills that match the job description and cleans up duplicates."
      />

      <form onSubmit={addSkill} className="flex gap-2 mb-6">
        <Input
          value={currentSkill}
          onChange={e => setCurrentSkill(e.target.value)}
          placeholder="e.g. Patient Care, Negotiation, Excel, Leadership, Python, Adobe Illustrator"
          className="flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-charcoal-900 text-white rounded-md font-medium hover:bg-charcoal-800 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {data.map(skill => (
          <span
            key={skill}
            className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full text-sm font-medium border border-brand-100 flex items-center gap-2"
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="hover:text-brand-900"
            >
              &times;
            </button>
          </span>
        ))}
        {data.length === 0 && (
          <p className="text-charcoal-400 italic text-sm">No skills added yet.</p>
        )}
      </div>
    </div>
  );
};

export const ExtracurricularStep: React.FC<{
  data: Extracurricular[];
  errors?: Record<string, string>;
  update: (d: Extracurricular[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () => update([...data, {
    id: crypto.randomUUID(),
    title: '',
    organization: '',
    startDate: '',
    endDate: '',
    description: '', // raw desc
    refinedBullets: []
  }]);

  const updateItem = (id: string, field: keyof Extracurricular, value: any) => {
    update(data.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Extracurricular Activities" desc="Leadership roles, clubs, and volunteering." />
      {data.map((item, index) => (
        <div key={item.id} className="p-4 border border-charcoal-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <div className="bg-brand-100 p-1.5 rounded-full text-brand-600">
                <Users size={16} />
              </div>
              Activity {index + 1}
            </h3>
            <button type="button" onClick={() => update(data.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700 transition-colors">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Role / Title" error={errors?.[`extracurriculars.${index}.title`]}>
              <Input error={errors?.[`extracurriculars.${index}.title`]} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="e.g. President, Volunteer Coordinator, Team Captain" />
            </InputGroup>
            <InputGroup label="Organization" error={errors?.[`extracurriculars.${index}.organization`]}>
              <Input error={errors?.[`extracurriculars.${index}.organization`]} value={item.organization} onChange={e => updateItem(item.id, 'organization', e.target.value)} placeholder="e.g. Debate Club, Red Cross, Habitat for Humanity" />
            </InputGroup>
            <InputGroup label="Start Date" error={errors?.[`extracurriculars.${index}.startDate`]}>
              <MonthPicker isError={!!errors?.[`extracurriculars.${index}.startDate`]} value={item.startDate} onChange={val => updateItem(item.id, 'startDate', val)} />
            </InputGroup>
            <InputGroup label="End Date" error={errors?.[`extracurriculars.${index}.endDate`]}>
              <MonthPicker isError={!!errors?.[`extracurriculars.${index}.endDate`]} value={item.endDate} onChange={val => updateItem(item.id, 'endDate', val)} />
            </InputGroup>
          </div>
          <InputGroup label="Description (Brain dump your contribution — AI will refine)">
            <TextArea rows={3} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="e.g. Led weekly meetings, organized 3 community fundraisers raising $8K, mentored 12 new members." />
          </InputGroup>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg text-charcoal-500 hover:border-brand-500 hover:text-brand-600 flex items-center justify-center gap-2 transition-colors">
        <Plus size={20} /> Add Activity
      </button>
    </div>
  );
}

export const AwardsStep: React.FC<{
  data: Award[];
  errors?: Record<string, string>;
  update: (d: Award[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), title: '', issuer: '', date: '', description: '' }]);
  const updateItem = (id: string, field: keyof Award, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Awards & Honors" desc="Scholarships, competitions, and recognition." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button type="button" onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <InputGroup label="Award Title" error={errors?.[`awards.${i}.title`]}><Input error={errors?.[`awards.${i}.title`]} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="e.g. Dean's List, Employee of the Year, Teacher of the Year, Rising Star Award" /></InputGroup>
            <InputGroup label="Issuer" error={errors?.[`awards.${i}.issuer`]}><Input error={errors?.[`awards.${i}.issuer`]} value={item.issuer} onChange={e => updateItem(item.id, 'issuer', e.target.value)} placeholder="e.g. University, Hospital Board, Chamber of Commerce" /></InputGroup>
            <InputGroup label="Date" error={errors?.[`awards.${i}.date`]}><MonthPicker isError={!!errors?.[`awards.${i}.date`]} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
          </div>
          <InputGroup label="Description (Optional)" className="mt-4"><TextArea rows={2} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></InputGroup>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg flex justify-center items-center gap-2 text-charcoal-500 hover:border-brand-500 hover:text-brand-600 transition-colors"><Plus size={20} /> Add Award</button>
    </div>
  );
};

export const CertificationsStep: React.FC<{
  data: Certification[];
  errors?: Record<string, string>;
  update: (d: Certification[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), name: '', issuer: '', date: '', link: '' }]);
  const updateItem = (id: string, field: keyof Certification, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Certifications" desc="Relevant professional certifications." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button type="button" onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <InputGroup label="Certification Name" error={errors?.[`certifications.${i}.name`]}><Input error={errors?.[`certifications.${i}.name`]} value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="e.g. PMP, CPA, RN License, Bar Admission, AWS Certified Solutions Architect" /></InputGroup>
            <InputGroup label="Issuer" error={errors?.[`certifications.${i}.issuer`]}><Input error={errors?.[`certifications.${i}.issuer`]} value={item.issuer} onChange={e => updateItem(item.id, 'issuer', e.target.value)} placeholder="e.g. PMI, State Board, AICPA, AWS" /></InputGroup>
            <InputGroup label="Date" error={errors?.[`certifications.${i}.date`]}><MonthPicker isError={!!errors?.[`certifications.${i}.date`]} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
            <InputGroup label="Link (Optional)"><Input type="url" value={item.link || ''} onChange={e => updateItem(item.id, 'link', e.target.value)} placeholder="https://..." /></InputGroup>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg flex justify-center items-center gap-2 text-charcoal-500 hover:border-brand-500 hover:text-brand-600 transition-colors"><Plus size={20} /> Add Certification</button>
    </div>
  );
};

export const AffiliationsStep: React.FC<{
  data: Affiliation[];
  errors?: Record<string, string>;
  update: (d: Affiliation[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), organization: '', role: '', startDate: '', endDate: '' }]);
  const updateItem = (id: string, field: keyof Affiliation, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Professional Affiliations" desc="Memberships in professional organizations." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button type="button" onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <InputGroup label="Organization" error={errors?.[`affiliations.${i}.organization`]}><Input error={errors?.[`affiliations.${i}.organization`]} value={item.organization} onChange={e => updateItem(item.id, 'organization', e.target.value)} placeholder="e.g. American Bar Association, ANA, AMA, IEEE, AIGA" /></InputGroup>
            <InputGroup label="Role" error={errors?.[`affiliations.${i}.role`]}><Input error={errors?.[`affiliations.${i}.role`]} value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} placeholder="e.g. Member, Board Member, Chair" /></InputGroup>
            <InputGroup label="Start Date" error={errors?.[`affiliations.${i}.startDate`]}><MonthPicker isError={!!errors?.[`affiliations.${i}.startDate`]} value={item.startDate} onChange={val => updateItem(item.id, 'startDate', val)} /></InputGroup>
            <InputGroup label="End Date" error={errors?.[`affiliations.${i}.endDate`]}><MonthPicker isError={!!errors?.[`affiliations.${i}.endDate`]} value={item.endDate} onChange={val => updateItem(item.id, 'endDate', val)} /></InputGroup>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg flex justify-center items-center gap-2 text-charcoal-500 hover:border-brand-500 hover:text-brand-600 transition-colors"><Plus size={20} /> Add Affiliation</button>
    </div>
  );
};

export const PublicationsStep: React.FC<{
  data: Publication[];
  errors?: Record<string, string>;
  update: (d: Publication[]) => void;
}> = ({ data, errors, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), title: '', publisher: '', date: '', link: '' }]);
  const updateItem = (id: string, field: keyof Publication, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Publications / Presentations" desc="Papers, articles, op-eds, case studies, conference talks, or media features." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button type="button" onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <InputGroup label="Title" error={errors?.[`publications.${i}.title`]}><Input error={errors?.[`publications.${i}.title`]} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="e.g. Nursing Care Best Practices; The Future of B2B Marketing; A Study on Neural Networks" /></InputGroup>
            <InputGroup label="Publisher / Conference" error={errors?.[`publications.${i}.publisher`]}><Input error={errors?.[`publications.${i}.publisher`]} value={item.publisher || ''} onChange={e => updateItem(item.id, 'publisher', e.target.value)} placeholder="e.g. Harvard Business Review, JAMA, Medium, NeurIPS" /></InputGroup>
            <InputGroup label="Date" error={errors?.[`publications.${i}.date`]}><MonthPicker isError={!!errors?.[`publications.${i}.date`]} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
            <InputGroup label="Link (Optional)"><Input type="url" value={item.link || ''} onChange={e => updateItem(item.id, 'link', e.target.value)} /></InputGroup>
          </div>
        </div>
      ))}
      <button type="button" onClick={addItem} className="w-full py-3 border-2 border-dashed border-charcoal-300 rounded-lg flex justify-center items-center gap-2 text-charcoal-500 hover:border-brand-500 hover:text-brand-600 transition-colors"><Plus size={20} /> Add Publication</button>
    </div>
  );
};

export const SectionSelectionStep: React.FC<{
  selected: string[];
  update: (sections: string[]) => void;
  userType?: UserType;
}> = ({ selected, update, userType }) => {
  // Define available sections based on typical usage
  // Some are core (Education, Skills) others optional
  const sections = [
    { id: 'experience', label: 'Experience', icon: <Briefcase size={20} />, required: userType === 'experienced' },
    { id: 'education', label: 'Education', icon: <GraduationCap size={20} /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit2 size={20} /> },
    { id: 'skills', label: 'Skills', icon: <BookOpen size={20} /> },
    { id: 'extracurriculars', label: 'Extracurricular Activities', icon: <Users size={20} /> },
    { id: 'awards', label: 'Awards & Honors', icon: <AwardIcon size={20} /> },
    { id: 'certifications', label: 'Certifications', icon: <AwardIcon size={20} /> },
    { id: 'affiliations', label: 'Affiliations', icon: <Users size={20} /> },
    { id: 'publications', label: 'Publications', icon: <BookOpen size={20} /> },
  ];

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      update(selected.filter(s => s !== id));
    } else {
      update([...selected, id]);
    }
  };

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Resume Sections"
        desc="Select the sections you want to include in your resume."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ id, label, icon, required }) => {
          const isSelected = selected.includes(id);
          // If required, always show as selected and disabled
          // But wait, user might want to hide even required sections if they really want to? 
          // Sticking to "required" logic for safety for now, or just let them choose.
          // Let's assume nothing is strictly forced except maybe PersonalInfo/Job.
          // Education/Experience are critical usually.

          return (
            <button
              key={id}
              onClick={() => handleToggle(id)}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isSelected
                ? 'border-brand-600 bg-brand-50 shadow-sm'
                : 'border-charcoal-200 hover:border-brand-300 hover:bg-charcoal-50'
                }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-600 text-white' : 'bg-charcoal-200 text-charcoal-500'}`}>
                {icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${isSelected ? 'text-charcoal-900' : 'text-charcoal-500'}`}>{label}</h3>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-brand-600 bg-brand-600' : 'border-charcoal-300'
                }`}>
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

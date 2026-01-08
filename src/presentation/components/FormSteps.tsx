// Presentation Layer - Form Components

import React, { useState } from 'react';
import {
  PersonalInfo,
  WorkExperience,
  Education,
  TargetJob,
  UserType,
  Project,
} from '../../domain/entities/Resume';
import { Plus, Trash2, Calendar, Briefcase, GraduationCap, FolderGit2 } from 'lucide-react';

// --- Shared UI ---
const InputGroup = ({
  label,
  children,
  className = '',
}: {
  label: string;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
  />
);

const TextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
  />
);

const SectionTitle = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
    <p className="text-gray-500 mt-1">{desc}</p>
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
            ? 'border-indigo-600 bg-indigo-50 shadow-lg'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'experienced'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600'
              }`}>
              <Briefcase size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Experienced Professional</h3>
          </div>
          <p className="text-gray-600 text-sm">
            I have work experience to include on my resume
          </p>
        </button>

        <button
          onClick={() => update('student')}
          className={`p-8 border-2 rounded-xl transition-all text-left ${userType === 'student'
            ? 'border-indigo-600 bg-indigo-50 shadow-lg'
            : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
            }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${userType === 'student'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-600'
              }`}>
              <GraduationCap size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Student / Entry Level</h3>
          </div>
          <p className="text-gray-600 text-sm">
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
            placeholder="e.g. Senior Frontend Engineer"
            value={data.title}
            onChange={e => update({ ...data, title: e.target.value })}
          />
        </InputGroup>
        <InputGroup label="Company Name">
          <Input
            placeholder="e.g. Google"
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
  update: (d: PersonalInfo) => void;
}> = ({ data, update }) => (
  <div className="animate-fade-in">
    <SectionTitle
      title="Personal Info"
      desc="How can recruiters contact you?"
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InputGroup label="Full Name">
        <Input
          value={data.fullName}
          onChange={e => update({ ...data, fullName: e.target.value })}
          placeholder="John Doe"
        />
      </InputGroup>
      <InputGroup label="Email">
        <Input
          type="email"
          value={data.email}
          onChange={e => update({ ...data, email: e.target.value })}
          placeholder="john@example.com"
        />
      </InputGroup>
      <InputGroup label="Phone">
        <Input
          type="tel"
          value={data.phone}
          onChange={e => update({ ...data, phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
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
          value={data.linkedin || ''}
          onChange={e => update({ ...data, linkedin: e.target.value })}
          placeholder="linkedin.com/in/johndoe"
        />
      </InputGroup>
      <InputGroup label="GitHub URL (Optional)">
        <Input
          value={data.github || ''}
          onChange={e => update({ ...data, github: e.target.value })}
          placeholder="github.com/johndoe"
        />
      </InputGroup>
      <InputGroup label="Portfolio / Website (Optional)">
        <Input
          value={data.website || ''}
          onChange={e => update({ ...data, website: e.target.value })}
          placeholder="johndoe.com"
        />
      </InputGroup>
    </div>
  </div>
);

export const ProjectsStep: React.FC<{
  data: Project[];
  update: (d: Project[]) => void;
}> = ({ data, update }) => {
  const addProject = () => {
    update([
      ...data,
      {
        id: crypto.randomUUID(),
        name: '',
        description: '',
        technologies: '',
      },
    ]);
  };

  const removeProject = (id: string) => update(data.filter(p => p.id !== id));

  const updateProject = (id: string, field: keyof Project, value: any) => {
    update(data.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  // Removed handleTechChange as it is no longer needed since we treat technologies as string


  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle
        title="Projects"
        desc="Showcase your work. Include academic projects, side projects, or open source contributions."
      />

      {data.map((project, index) => (
        <div
          key={project.id}
          className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-orange-100 p-1.5 rounded-full text-orange-600">
                <FolderGit2 size={16} />
              </div>
              Project {index + 1}
            </h3>
            <button
              onClick={() => removeProject(project.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <InputGroup label="Project Name">
              <Input
                value={project.name}
                onChange={e => updateProject(project.id, 'name', e.target.value)}
                placeholder="e.g. E-commerce Platform"
              />
            </InputGroup>

            <InputGroup label="Technologies Used (comma separated)">
              <Input
                value={project.technologies}
                onChange={e => updateProject(project.id, 'technologies', e.target.value)}
                placeholder="React, Node.js, MongoDB"
              />
            </InputGroup>

            <InputGroup label="Project Link (Optional)">
              <Input
                value={project.link || ''}
                onChange={e => updateProject(project.id, 'link', e.target.value)}
                placeholder="https://github.com/..."
              />
            </InputGroup>

            <InputGroup label="Description">
              <TextArea
                rows={3}
                value={project.description}
                onChange={e => updateProject(project.id, 'description', e.target.value)}
                placeholder="Briefly describe what you built and your role..."
              />
            </InputGroup>
          </div>
        </div>
      ))}

      <button
        onClick={addProject}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-2 transition-all"
      >
        <Plus size={20} /> Add Project
      </button>
    </div>
  );
};

export const ExperienceStep: React.FC<{
  data: WorkExperience[];
  update: (d: WorkExperience[]) => void;
}> = ({ data, update }) => {
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
          className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600">
                <Briefcase size={16} />
              </div>
              Position {index + 1}
            </h3>
            <button
              onClick={() => removeExp(exp.id)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <InputGroup label="Job Title">
              <Input
                value={exp.role}
                onChange={e => updateExp(exp.id, 'role', e.target.value)}
                placeholder="Software Engineer"
              />
            </InputGroup>
            <InputGroup label="Company">
              <Input
                value={exp.company}
                onChange={e => updateExp(exp.id, 'company', e.target.value)}
                placeholder="Acme Corp"
              />
            </InputGroup>
            <InputGroup label="Start Date">
              <Input
                value={exp.startDate}
                onChange={e => updateExp(exp.id, 'startDate', e.target.value)}
                placeholder="Jan 2020"
              />
            </InputGroup>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="flex gap-2 items-center h-full">
                <Input
                  disabled={exp.isCurrent}
                  value={exp.endDate}
                  onChange={e => updateExp(exp.id, 'endDate', e.target.value)}
                  placeholder={exp.isCurrent ? 'Present' : 'Dec 2022'}
                />
                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={e =>
                      updateExp(exp.id, 'isCurrent', e.target.checked)
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Current
                </label>
              </div>
            </div>
          </div>

          <InputGroup label="What did you achieve? (Brain dump here, AI will refine it)">
            <TextArea
              rows={4}
              value={exp.rawDescription}
              onChange={e => updateExp(exp.id, 'rawDescription', e.target.value)}
              placeholder="- Led a team of 5 developers&#10;- Improved site speed by 50%&#10;- Used React and Node.js"
            />
          </InputGroup>
        </div>
      ))}

      <button
        onClick={addExp}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-2 transition-all"
      >
        <Plus size={20} /> Add Position
      </button>
    </div>
  );
};

export const EducationStep: React.FC<{
  data: Education[];
  update: (d: Education[]) => void;
}> = ({ data, update }) => {
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
          className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-green-100 p-1.5 rounded-full text-green-600">
                <GraduationCap size={16} />
              </div>
              School {index + 1}
            </h3>
            <button
              onClick={() => removeEdu(edu.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="School / University">
              <Input
                value={edu.school}
                onChange={e => updateEdu(edu.id, 'school', e.target.value)}
                placeholder="Stanford University"
              />
            </InputGroup>
            <InputGroup label="Degree">
              <Input
                value={edu.degree}
                onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                placeholder="Bachelor of Science"
              />
            </InputGroup>
            <InputGroup label="Field of Study">
              <Input
                value={edu.field}
                onChange={e => updateEdu(edu.id, 'field', e.target.value)}
                placeholder="Computer Science"
              />
            </InputGroup>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Start Year">
                <Input
                  value={edu.startDate}
                  onChange={e => updateEdu(edu.id, 'startDate', e.target.value)}
                  placeholder="2018"
                />
              </InputGroup>
              <InputGroup label="End Year">
                <Input
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
        onClick={addEdu}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-500 hover:text-indigo-600 font-medium flex items-center justify-center gap-2 transition-all"
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
        desc="List your top technical and soft skills. The AI will categorize and refine these."
      />

      <form onSubmit={addSkill} className="flex gap-2 mb-6">
        <Input
          value={currentSkill}
          onChange={e => setCurrentSkill(e.target.value)}
          placeholder="e.g. JavaScript, Project Management, Communication"
          className="flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gray-900 text-white rounded-md font-medium hover:bg-gray-800 transition-colors"
        >
          Add
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {data.map(skill => (
          <span
            key={skill}
            className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100 flex items-center gap-2"
          >
            {skill}
            <button
              onClick={() => removeSkill(skill)}
              className="hover:text-indigo-900"
            >
              &times;
            </button>
          </span>
        ))}
        {data.length === 0 && (
          <p className="text-gray-400 italic text-sm">No skills added yet.</p>
        )}
      </div>
    </div>
  );
};


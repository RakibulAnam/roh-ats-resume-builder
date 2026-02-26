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

type InputProps = React.ComponentProps<'input'> & {
  isError?: boolean;
};

const Input = ({ isError, className, ...props }: InputProps) => (
  <input
    {...props}
    className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all disabled:bg-gray-100 disabled:text-gray-400 ${isError
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
      } ${className || ''}`}
  />
);

type TextAreaProps = React.ComponentProps<'textarea'> & {
  isError?: boolean;
};

const TextArea = ({ isError, className, ...props }: TextAreaProps) => (
  <textarea
    {...props}
    className={`w-full rounded-md border px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 transition-all ${isError
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:ring-indigo-500 focus:border-transparent'
      } ${className || ''}`}
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
          isError={!(data.fullName || '').trim()}
          value={data.fullName}
          onChange={e => update({ ...data, fullName: e.target.value })}
          placeholder="John Doe"
        />
      </InputGroup>
      <InputGroup label="Email">
        <Input
          isError={!(data.email || '').trim()}
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
                isError={!(project.name || '').trim()}
                value={project.name}
                onChange={e => updateProject(project.id, 'name', e.target.value)}
                placeholder="e.g. E-commerce Platform"
              />
            </InputGroup>

            <InputGroup label="Technologies Used (comma separated)">
              <Input
                isError={!(project.technologies || '').trim()}
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

            <InputGroup label="Description (Brain dump your contribution, AI will refine)">
              <TextArea
                isError={!(project.rawDescription || '').trim()}
                rows={3}
                value={project.rawDescription}
                onChange={e => updateProject(project.id, 'rawDescription', e.target.value)}
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
                isError={!(exp.role || '').trim()}
                value={exp.role}
                onChange={e => updateExp(exp.id, 'role', e.target.value)}
                placeholder="Software Engineer"
              />
            </InputGroup>
            <InputGroup label="Company">
              <Input
                isError={!(exp.company || '').trim()}
                value={exp.company}
                onChange={e => updateExp(exp.id, 'company', e.target.value)}
                placeholder="Acme Corp"
              />
            </InputGroup>

            <InputGroup label="Start Date">
              <MonthPicker
                isError={!(exp.startDate || '').trim()}
                value={exp.startDate}
                onChange={val => updateExp(exp.id, 'startDate', val)}
              />
            </InputGroup>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <div className="flex flex-col gap-2">

                {exp.isCurrent ? (
                  <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 font-medium">
                    Present
                  </div>
                ) : (
                  <MonthPicker
                    isError={!exp.isCurrent && !(exp.endDate || '').trim()}
                    value={exp.endDate}
                    onChange={val => updateExp(exp.id, 'endDate', val)}
                  />
                )}

                <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={exp.isCurrent}
                    onChange={e => {
                      const isCurrent = e.target.checked;
                      // Single update with both changes to avoid race condition
                      update(data.map(item =>
                        item.id === exp.id
                          ? { ...item, isCurrent, endDate: isCurrent ? '' : item.endDate }
                          : item
                      ));
                    }}
                  />
                  <span className={`text-sm font-medium ${exp.isCurrent ? 'text-indigo-700' : 'text-gray-600'}`}>
                    I currently work here
                  </span>
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
                isError={!(edu.school || '').trim()}
                value={edu.school}
                onChange={e => updateEdu(edu.id, 'school', e.target.value)}
                placeholder="Stanford University"
              />
            </InputGroup>
            <InputGroup label="Degree">
              <Input
                isError={!(edu.degree || '').trim()}
                value={edu.degree}
                onChange={e => updateEdu(edu.id, 'degree', e.target.value)}
                placeholder="Bachelor of Science"
              />
            </InputGroup>
            <InputGroup label="Field of Study">
              <Input
                isError={!(edu.field || '').trim()}
                value={edu.field}
                onChange={e => updateEdu(edu.id, 'field', e.target.value)}
                placeholder="Computer Science"
              />
            </InputGroup>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label="Start Year">
                <Input
                  value={edu.startDate}
                  isError={!(edu.startDate || '').trim()}
                  onChange={e => updateEdu(edu.id, 'startDate', e.target.value)}
                  placeholder="2018"
                />
              </InputGroup>
              <InputGroup label="End Year">
                <Input
                  value={edu.endDate}
                  isError={!(edu.endDate || '').trim()}
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

export const ExtracurricularStep: React.FC<{
  data: Extracurricular[];
  update: (d: Extracurricular[]) => void;
}> = ({ data, update }) => {
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
        <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-full text-purple-600">
                <Users size={16} />
              </div>
              Activity {index + 1}
            </h3>
            <button onClick={() => update(data.filter(i => i.id !== item.id))} className="text-red-500 hover:text-red-700">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Role / Title">
              <Input isError={!(item.title || '').trim()} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="President" />
            </InputGroup>
            <InputGroup label="Organization">
              <Input isError={!(item.organization || '').trim()} value={item.organization} onChange={e => updateItem(item.id, 'organization', e.target.value)} placeholder="Debate Club" />
            </InputGroup>
            <InputGroup label="Start Date">
              <MonthPicker isError={!(item.startDate || '').trim()} value={item.startDate} onChange={val => updateItem(item.id, 'startDate', val)} />
            </InputGroup>
            <InputGroup label="End Date">
              <MonthPicker isError={!(item.endDate || '').trim()} value={item.endDate} onChange={val => updateItem(item.id, 'endDate', val)} />
            </InputGroup>
          </div>
          <InputGroup label="Description (Brain dump your contribution, AI will refine)">
            <TextArea rows={3} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Led weekly meetings..." />
          </InputGroup>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 flex items-center justify-center gap-2 transition-all">
        <Plus size={20} /> Add Activity
      </button>
    </div>
  );
}

export const AwardsStep: React.FC<{
  data: Award[];
  update: (d: Award[]) => void;
}> = ({ data, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), title: '', issuer: '', date: '', description: '' }]);
  const updateItem = (id: string, field: keyof Award, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Awards & Honors" desc="Scholarships, competitions, and recognition." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Award Title"><Input isError={!(item.title || '').trim()} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="Dean's List" /></InputGroup>
            <InputGroup label="Issuer"><Input isError={!(item.issuer || '').trim()} value={item.issuer} onChange={e => updateItem(item.id, 'issuer', e.target.value)} placeholder="University" /></InputGroup>
            <InputGroup label="Date"><MonthPicker isError={!(item.date || '').trim()} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
          </div>
          <InputGroup label="Description (Optional)" className="mt-4"><TextArea rows={2} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></InputGroup>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center gap-2 text-gray-500 hover:text-indigo-600"><Plus size={20} /> Add Award</button>
    </div>
  );
};

export const CertificationsStep: React.FC<{
  data: Certification[];
  update: (d: Certification[]) => void;
}> = ({ data, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), name: '', issuer: '', date: '', link: '' }]);
  const updateItem = (id: string, field: keyof Certification, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Certifications" desc="Relevant professional certifications." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Certification Name"><Input isError={!(item.name || '').trim()} value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="AWS Certified Solutions Architect" /></InputGroup>
            <InputGroup label="Issuer"><Input isError={!(item.issuer || '').trim()} value={item.issuer} onChange={e => updateItem(item.id, 'issuer', e.target.value)} placeholder="Amazon Web Services" /></InputGroup>
            <InputGroup label="Date"><MonthPicker isError={!(item.date || '').trim()} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
            <InputGroup label="Link (Optional)"><Input value={item.link || ''} onChange={e => updateItem(item.id, 'link', e.target.value)} placeholder="https://..." /></InputGroup>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center gap-2 text-gray-500 hover:text-indigo-600"><Plus size={20} /> Add Certification</button>
    </div>
  );
};

export const AffiliationsStep: React.FC<{
  data: Affiliation[];
  update: (d: Affiliation[]) => void;
}> = ({ data, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), organization: '', role: '', startDate: '', endDate: '' }]);
  const updateItem = (id: string, field: keyof Affiliation, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Professional Affiliations" desc="Memberships in professional organizations." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Organization"><Input isError={!(item.organization || '').trim()} value={item.organization} onChange={e => updateItem(item.id, 'organization', e.target.value)} placeholder="IEEE" /></InputGroup>
            <InputGroup label="Role"><Input isError={!(item.role || '').trim()} value={item.role} onChange={e => updateItem(item.id, 'role', e.target.value)} placeholder="Member" /></InputGroup>
            <InputGroup label="Start Date"><MonthPicker isError={!(item.startDate || '').trim()} value={item.startDate} onChange={val => updateItem(item.id, 'startDate', val)} /></InputGroup>
            <InputGroup label="End Date"><MonthPicker isError={!(item.endDate || '').trim()} value={item.endDate} onChange={val => updateItem(item.id, 'endDate', val)} /></InputGroup>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center gap-2 text-gray-500 hover:text-indigo-600"><Plus size={20} /> Add Affiliation</button>
    </div>
  );
};

export const PublicationsStep: React.FC<{
  data: Publication[];
  update: (d: Publication[]) => void;
}> = ({ data, update }) => {
  const addItem = () => update([...data, { id: crypto.randomUUID(), title: '', publisher: '', date: '', link: '' }]);
  const updateItem = (id: string, field: keyof Publication, value: any) => update(data.map(i => i.id === id ? { ...i, [field]: value } : i));

  return (
    <div className="animate-fade-in space-y-6">
      <SectionTitle title="Publications / Presentations" desc="Papers, articles, or conference talks." />
      {data.map((item, i) => (
        <div key={item.id} className="p-4 border rounded-lg bg-white shadow-sm relative">
          <button onClick={() => update(data.filter(x => x.id !== item.id))} className="absolute top-4 right-4 text-red-500"><Trash2 size={18} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Title"><Input isError={!(item.title || '').trim()} value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="Research on AI" /></InputGroup>
            <InputGroup label="Publisher / Conference"><Input isError={!(item.publisher || '').trim()} value={item.publisher || ''} onChange={e => updateItem(item.id, 'publisher', e.target.value)} placeholder="Journal of Tech" /></InputGroup>
            <InputGroup label="Date"><MonthPicker isError={!(item.date || '').trim()} value={item.date} onChange={val => updateItem(item.id, 'date', val)} /></InputGroup>
            <InputGroup label="Link (Optional)"><Input value={item.link || ''} onChange={e => updateItem(item.id, 'link', e.target.value)} /></InputGroup>
          </div>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg flex justify-center items-center gap-2 text-gray-500 hover:text-indigo-600"><Plus size={20} /> Add Publication</button>
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
                ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{label}</h3>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
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

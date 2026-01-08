// Presentation Layer - Preview Component

import React, { useState } from 'react';
import { ResumeData } from '../../domain/entities/Resume';
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Globe,
  Download,
  FileText,
  Printer,
  ArrowLeft,
  Github,
  FileCheck,
} from 'lucide-react';

interface PreviewProps {
  data: ResumeData;
  onEdit: () => void;
  onExportWord: (data: ResumeData) => Promise<void>;
  onExportCoverLetter?: (data: ResumeData) => Promise<void>;
}

export const Preview: React.FC<PreviewProps> = ({
  data,
  onEdit,
  onExportWord,
  onExportCoverLetter,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');

  const handleWordExport = async () => {
    setIsExporting(true);
    try {
      await onExportWord(data);
    } catch (error) {
      console.error('Export failed', error);
      alert(
        `Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleCoverLetterExport = async () => {
    if (!onExportCoverLetter) return;
    setIsExporting(true);
    try {
      await onExportCoverLetter(data);
    } catch (error) {
      console.error('Cover letter export failed', error);
      alert(
        `Failed to generate cover letter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handlePDFExport = () => {
    // Use direct print which preserves all styles perfectly
    // Hide non-print elements temporarily
    const noPrintElements = document.querySelectorAll('.no-print');
    noPrintElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });

    // Trigger print
    window.print();

    // Restore non-print elements after a delay
    setTimeout(() => {
      noPrintElements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 print:bg-white print:p-0 print:block">
      {/* Toolbar - Hidden in Print */}
      <div className="w-full max-w-[210mm] mb-6 flex flex-col gap-4 no-print px-4 md:px-0">
        {/* Tabs */}
        {data.coverLetter && (
          <div className="flex gap-2 bg-white p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'resume'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'coverLetter'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              Cover Letter
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Edit
          </button>

          <div className="flex flex-wrap gap-3">
            {activeTab === 'resume' ? (
              <>
                <button
                  onClick={handleWordExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 shadow-sm transition-all disabled:opacity-50"
                >
                  <FileText size={16} />
                  {isExporting ? 'Generating...' : 'Download Resume (Word)'}
                </button>
                <button
                  onClick={handlePDFExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Printer size={16} />
                  Download Resume (PDF)
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCoverLetterExport}
                  disabled={isExporting || !onExportCoverLetter}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50 shadow-sm transition-all disabled:opacity-50"
                >
                  <FileCheck size={16} />
                  {isExporting ? 'Generating...' : 'Download Cover Letter (Word)'}
                </button>
                <button
                  onClick={handlePDFExport}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <Printer size={16} />
                  Download Cover Letter (PDF)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Resume Preview */}
      <div
        id="resume-preview"
        className={`w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] text-left mx-auto
                   print:shadow-none print:w-full print:min-h-0 print:h-auto print:p-[15mm] print:mx-0
                   flex flex-col ${activeTab !== 'resume' ? 'hidden print:hidden' : ''}`}
        style={{ color: '#000' }}
      >
        {/* Header */}
        <header className="border-b-2 border-gray-800 pb-4 mb-6 break-inside-avoid">
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wide text-gray-900 mb-2 break-words">
            {data.personalInfo.fullName || 'Your Name'}
          </h1>
          <p className="text-lg text-gray-700 font-medium mb-3 break-words">
            {data.targetJob.title ? `Targeting: ${data.targetJob.title}` : ''}
          </p>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
            {data.personalInfo.email && (
              <div className="flex items-center gap-1">
                <Mail size={14} />{' '}
                <span className="break-all">{data.personalInfo.email}</span>
              </div>
            )}
            {data.personalInfo.phone && (
              <div className="flex items-center gap-1">
                <Phone size={14} /> <span>{data.personalInfo.phone}</span>
              </div>
            )}
            {data.personalInfo.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} /> <span>{data.personalInfo.location}</span>
              </div>
            )}
            {data.personalInfo.linkedin && (
              <div className="flex items-center gap-1">
                <Linkedin size={14} />
                <a
                  href={data.personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
                >
                  LinkedIn
                </a>
              </div>
            )}
            {data.personalInfo.github && (
              <div className="flex items-center gap-1">
                <Github size={14} />
                <a
                  href={data.personalInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
                >
                  GitHub
                </a>
              </div>
            )}
            {data.personalInfo.website && (
              <div className="flex items-center gap-1">
                <Globe size={14} />
                <a
                  href={data.personalInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline break-all"
                >
                  Portfolio
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Professional Summary */}
        {data.summary && (
          <section className="mb-6 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-3 pb-1 text-gray-800">
              Professional Summary
            </h3>
            <p className="text-sm leading-relaxed text-gray-800 text-justify break-words whitespace-pre-line">
              {data.summary}
            </p>
          </section>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800 break-inside-avoid">
              Experience
            </h3>
            <div className="space-y-5">
              {data.experience.map(exp => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-base mr-2">
                      {exp.role}
                    </h4>
                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 italic mb-2">
                    {exp.company}
                  </div>
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.refinedBullets && exp.refinedBullets.length > 0 ? (
                      exp.refinedBullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-800 leading-snug pl-1 break-words"
                        >
                          {bullet}
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-gray-800 leading-snug pl-1 text-gray-400 italic">
                        No description provided.
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {data.projects && data.projects.length > 0 && (
          <section className="mb-6 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Projects
            </h3>
            <div className="space-y-4">
              {data.projects.map(project => (
                <div key={project.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline mb-1 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-base mr-2 flex items-center gap-2">
                      {project.name}
                      {project.link && (
                        <a
                          href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-normal text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1"
                        >
                          <Globe size={12} /> View Project
                        </a>
                      )}
                    </h4>
                  </div>
                  {project.technologies && (
                    <div className="text-sm text-gray-700 italic mb-1">
                      Technologies: {project.technologies}
                    </div>
                  )}
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <section className="mb-6 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Education
            </h3>
            <div className="space-y-3">
              {data.education.map(edu => (
                <div key={edu.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline flex-wrap">
                    <h4 className="font-bold text-gray-900 mr-2">{edu.school}</h4>
                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {edu.startDate} – {edu.endDate}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {edu.degree} {edu.field ? `in ${edu.field}` : ''}
                    {edu.gpa && (
                      <span className="ml-2 font-semibold">• GPA: {edu.gpa}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <section className="mb-6 break-inside-avoid">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-3 pb-1 text-gray-800">
              Skills
            </h3>
            <div className="text-sm text-gray-800 leading-relaxed break-words">
              {data.skills.join(' • ')}
            </div>
          </section>
        )}
      </div>

      {/* Cover Letter Preview */}
      {
        data.coverLetter && (
          <div
            id="cover-letter-preview"
            className={`w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] text-left mx-auto
                     print:shadow-none print:w-full print:min-h-0 print:h-auto print:p-[15mm] print:mx-0
                     flex flex-col ${activeTab !== 'coverLetter' ? 'hidden print:hidden' : ''}`}
            style={{ color: '#000' }}
          >
            {/* Header */}
            <div className="mb-8 break-inside-avoid">
              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-4">
                {data.personalInfo.email && (
                  <span>{data.personalInfo.email}</span>
                )}
                {data.personalInfo.phone && (
                  <span>• {data.personalInfo.phone}</span>
                )}
                {data.personalInfo.location && (
                  <span>• {data.personalInfo.location}</span>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-4">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              {data.targetJob.company && (
                <div className="text-sm text-gray-800 mb-2">
                  {data.targetJob.company}
                </div>
              )}
              <div className="text-sm text-gray-800 mb-6">
                Hiring Manager
              </div>
            </div>

            {/* Cover Letter Body */}
            <div className="flex-1 text-sm leading-relaxed text-gray-800 whitespace-pre-line break-words">
              {data.coverLetter}
            </div>

            {/* Closing */}
            <div className="mt-8 break-inside-avoid">
              <div className="mb-4">Sincerely,</div>
              <div className="font-semibold">{data.personalInfo.fullName}</div>
            </div>
          </div>
        )
      }

      <p className="mt-8 text-xs text-gray-400 no-print">
        Tip: For PDF, use "Save as PDF" in the print dialog. Uncheck "Headers and
        footers".
      </p>
    </div >
  );
};


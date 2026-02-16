// Presentation Layer - Preview Component

import React, { useState } from 'react';
import { toast } from 'sonner';
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
import { EditableElement } from './EditableElement';

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const s = dateString.toLowerCase();
  if (s === 'present' || s === 'current') return 'Present';

  // Check for YYYY-MM
  const match = dateString.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const date = new Date(year, month);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
  return dateString;
};

interface PreviewProps {
  data: ResumeData;
  onUpdate: (data: ResumeData) => void;
  onExportWord: (data: ResumeData) => Promise<void>;
  onExportCoverLetter?: (data: ResumeData) => Promise<void>;
  onGoHome: () => void;
  readOnly?: boolean;
}

export const Preview: React.FC<PreviewProps> = ({
  data,
  onUpdate,
  onExportWord,
  onExportCoverLetter,
  onGoHome,
  readOnly = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');

  const handleWordExport = async () => {
    setIsExporting(true);
    try {
      await onExportWord(data);
      toast.success('Resume exported to Word successfully!');
    } catch (error) {
      console.error('Export failed', error);
      toast.error(
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
      toast.success('Cover letter exported to Word successfully!');
    } catch (error) {
      console.error('Cover letter export failed', error);
      toast.error(
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
      <style>{`
        @media print {
          @page { 
            margin: 15mm; 
            size: A4; 
          }
          
          body { 
            margin: 0; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }

          /* Force block display on the resume/cover letter container to fix flexbox pagination issues
             BUT only if it is not currently hidden (respecting the active tab) */
          #resume-preview:not(.hidden), 
          #cover-letter-preview:not(.hidden) {
            display: block !important;
            width: 100% !important;
            min-height: auto !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* Ensure hidden elements DO NOT show up in print */
          .hidden, .print\\:hidden {
            display: none !important;
          }

          /* Avoid breaking inside sections, but allow it if the section is huge */
          section {
            break-inside: auto; 
            page-break-inside: auto;
            padding-bottom: 0 !important;
            margin-bottom: 1rem !important;
          }

          /* Keep headers with their following content */
          h1, h2, h3, h4, h5, h6 {
            break-after: avoid;
            page-break-after: avoid;
          }
          
          /* Prevent headers from being orphaned at bottom of page */
          h3 {
             break-inside: avoid;
             page-break-inside: avoid;
          }

          /* Keep entire list items together to avoid bullet separation */
          li {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Keep job/project headers together (Role + Date + Company) 
             Targeting the first div inside an experience/project item block */
          .space-y-5 > div > div:first-child,
          .space-y-4 > div > div:first-child {
            break-inside: avoid;
            page-break-inside: avoid;
            break-after: avoid;
            page-break-after: avoid;
          }

          /* Ensure nice spacing adjustments for print */
          p, div, li {
            orphans: 3;
            widows: 3;
          }

          /* Fix header spacing */
          header {
            break-inside: avoid;
            margin-bottom: 1.5rem !important;
          }
        }
      `}</style>
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
            onClick={onGoHome}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
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
          <EditableElement
            as="h1"
            value={data.personalInfo.fullName}
            onSave={(val) => onUpdate({ ...data, personalInfo: { ...data.personalInfo, fullName: val } })}
            className="text-4xl font-bold font-serif uppercase tracking-wide text-gray-900 mb-2 break-words block"
            placeholder="YOUR NAME"
            readOnly={readOnly}
          />
          <div className="text-lg text-gray-700 font-medium mb-3 break-words flex gap-2">
            <span className="text-gray-500">Targeting:</span>
            <EditableElement
              value={data.targetJob.title}
              onSave={(val) => onUpdate({ ...data, targetJob: { ...data.targetJob, title: val } })}
              placeholder="Target Job Title"
              readOnly={readOnly}
            />
          </div>

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
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-3 pb-1 text-gray-800">
              Professional Summary
            </h3>
            <EditableElement
              as="p"
              multiline
              value={data.summary || ''}
              onSave={(val) => onUpdate({ ...data, summary: val })}
              className="text-sm leading-relaxed text-gray-800 text-justify break-words whitespace-pre-line"
              placeholder="Add a professional summary..."
              readOnly={readOnly}
            />
          </section>
        )}


        {/* Experience */}
        {(!data.visibleSections || data.visibleSections.includes('experience')) && data.experience.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Experience
            </h3>
            <div className="space-y-5">
              {data.experience.map((exp, expIdx) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1 flex-wrap gap-2">
                    <EditableElement
                      as="h4"
                      value={exp.role}
                      onSave={(val) => {
                        const newExp = [...data.experience];
                        newExp[expIdx] = { ...newExp[expIdx], role: val };
                        onUpdate({ ...data, experience: newExp });
                      }}
                      className="font-bold text-gray-900 text-base mr-2"
                      placeholder="Role"
                      readOnly={readOnly}
                    />
                    <div className="flex gap-1 text-sm text-gray-600 font-medium whitespace-nowrap">
                      <EditableElement
                        value={formatDate(exp.startDate)}
                        onSave={(val) => {
                          const newExp = [...data.experience];
                          newExp[expIdx] = { ...newExp[expIdx], startDate: val };
                          onUpdate({ ...data, experience: newExp });
                        }}
                        placeholder="Date"
                        readOnly={readOnly}
                      />
                      <span>–</span>
                      <EditableElement
                        value={exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                        onSave={(val) => {
                          const newExp = [...data.experience];
                          newExp[expIdx] = { ...newExp[expIdx], endDate: val, isCurrent: val.toLowerCase() === 'present' }; // Basic handling
                          onUpdate({ ...data, experience: newExp });
                        }}
                        placeholder="Date"
                        readOnly={readOnly}
                      />
                    </div>
                  </div>
                  <EditableElement
                    value={exp.company}
                    onSave={(val) => {
                      const newExp = [...data.experience];
                      newExp[expIdx] = { ...newExp[expIdx], company: val };
                      onUpdate({ ...data, experience: newExp });
                    }}
                    className="text-sm font-semibold text-gray-700 italic mb-2 block"
                    placeholder="Company"
                    readOnly={readOnly}
                  />
                  <ul className="list-disc ml-5 space-y-1">
                    {exp.refinedBullets && exp.refinedBullets.length > 0 ? (
                      exp.refinedBullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-800 leading-snug pl-1 break-words"
                        >
                          <EditableElement
                            multiline
                            value={bullet}
                            onSave={(val) => {
                              const newExp = [...data.experience];
                              const newBullets = [...(newExp[expIdx].refinedBullets || [])];
                              newBullets[idx] = val;
                              newExp[expIdx] = { ...newExp[expIdx], refinedBullets: newBullets };
                              onUpdate({ ...data, experience: newExp });
                            }}
                            readOnly={readOnly}
                          />
                        </li>
                      ))
                    ) : (
                      <div className="text-sm text-gray-800 leading-snug pl-1 whitespace-pre-line">
                        <EditableElement
                          multiline
                          value={(exp as any).rawDescription || (exp as any).description || ''}
                          onSave={(val) => {
                            const newExp = [...data.experience];
                            newExp[expIdx] = { ...newExp[expIdx], rawDescription: val, description: val };
                            onUpdate({ ...data, experience: newExp });
                          }}
                          placeholder="No description provided. Click to add one."
                          className="italic"
                          readOnly={readOnly}
                        />
                      </div>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {(!data.visibleSections || data.visibleSections.includes('projects')) && data.projects && data.projects.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Projects
            </h3>
            <div className="space-y-4">
              {data.projects.map(project => (
                <div key={project.id}>
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
        {(!data.visibleSections || data.visibleSections.includes('education')) && data.education.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Education
            </h3>
            <div className="space-y-3">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline flex-wrap">
                    <h4 className="font-bold text-gray-900 mr-2">{edu.school}</h4>
                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
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

        {/* Certifications */}
        {(!data.visibleSections || data.visibleSections.includes('certifications')) && data.certifications && data.certifications.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Certifications
            </h3>
            <div className="space-y-3">
              {data.certifications.map(cert => (
                <div key={cert.id}>
                  <div className="flex justify-between items-baseline flex-wrap">
                    <h4 className="font-bold text-gray-900 mr-2">
                      {cert.name}
                      {cert.link && (
                        <a href={cert.link} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline text-xs font-normal">Link</a>
                      )}
                    </h4>
                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {cert.date}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">{cert.issuer}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Extracurriculars */}
        {(!data.visibleSections || data.visibleSections.includes('extracurriculars')) && data.extracurriculars && data.extracurriculars.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">
              Extracurricular Activities
            </h3>
            <div className="space-y-4">
              {data.extracurriculars.map(activity => (
                <div key={activity.id}>
                  <div className="flex justify-between items-baseline mb-1 flex-wrap">
                    <h4 className="font-bold text-gray-900 text-base mr-2">{activity.title}</h4>
                    <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {activity.startDate} – {activity.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 italic mb-1">
                    {activity.organization}
                  </div>
                  {activity.refinedBullets && activity.refinedBullets.length > 0 ? (
                    <ul className="list-disc ml-5 space-y-1">
                      {activity.refinedBullets.map((bullet, i) => (
                        <li key={i} className="text-sm text-gray-800 leading-snug pl-1">{bullet}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-800 whitespace-pre-line">
                      {(activity as any).description || (activity as any).rawDescription || "No description provided."}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Awards */}
        {(!data.visibleSections || data.visibleSections.includes('awards')) && data.awards && data.awards.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">Awards & Honors</h3>
            <ul className="space-y-2">
              {data.awards.map(award => (
                <li key={award.id}>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-gray-900 text-sm">{award.title}</span>
                    <span className="text-sm text-gray-600">{award.date}</span>
                  </div>
                  <div className="text-sm text-gray-700">{award.issuer} {award.description ? `- ${award.description}` : ''}</div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Publications */}
        {(!data.visibleSections || data.visibleSections.includes('publications')) && data.publications && data.publications.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">Publications</h3>
            <div className="space-y-3">
              {data.publications.map(pub => (
                <div key={pub.id} className="text-sm text-gray-800">
                  <span className="font-bold">{pub.title}</span>, {pub.publisher}, {pub.date}.
                  {pub.link && (
                    <a href={pub.link} target="_blank" rel="noreferrer" className="ml-1 text-indigo-600 hover:underline">[Link]</a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Affiliations */}
        {(!data.visibleSections || data.visibleSections.includes('affiliations')) && data.affiliations && data.affiliations.length > 0 && (
          <section className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-4 pb-1 text-gray-800">Affiliations</h3>
            <ul className="list-disc ml-5 space-y-1">
              {data.affiliations.map(aff => (
                <li key={aff.id} className="text-sm text-gray-800">
                  <span className="font-semibold">{aff.role}</span>, {aff.organization} ({aff.startDate} – {aff.endDate})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Skills */}
        {(!data.visibleSections || data.visibleSections.includes('skills')) && data.skills.length > 0 && (
          <section className="mb-6">
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


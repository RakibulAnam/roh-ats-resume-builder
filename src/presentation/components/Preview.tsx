// Presentation Layer - Preview Component

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ResumeData, ResumeTemplate } from '../../domain/entities/Resume';
import { templateRegistry } from '../templates/TemplateRegistry';
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
  Layout,
  Award,
  Briefcase,
  Grid,
  FileSignature,
  File,
  Terminal,
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

  const templateId = data.template || 'classic';
  const template = templateRegistry[templateId] || templateRegistry['classic'];
  const isStrict = data.isATSStrict || false;

  const activeTypography = template.typography;
  const activeColors = isStrict ? {
    primary: 'text-black',
    text: 'text-black',
    muted: 'text-charcoal-800',
    divider: 'border-transparent'
  } : template.colors;

  const activeDivider = isStrict ? 'none' : template.layout.sectionDivider;
  const sectionHeaderClass = `text-sm uppercase tracking-wider mb-3 pb-1 ${activeTypography.headingWeight} ${activeColors.primary} ${activeDivider === 'line' ? 'border-b ' + activeColors.divider : ''} ${template.layout.headerAlignment === 'center' ? 'text-center' : ''}`;

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

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'modern': return <Layout size={18} />;
      case 'executive': return <Award size={18} />;
      case 'minimal': return <File size={18} />;
      case 'professional-blue': return <Briefcase size={18} />;
      case 'compact': return <Grid size={18} />;
      case 'elegant': return <FileSignature size={18} />;
      case 'technical': return <Terminal size={18} />;
      case 'classic':
      default: return <FileText size={18} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-charcoal-50 overflow-hidden print:h-auto print:bg-white print:block">
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
      {/* Top Navbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-charcoal-200 no-print shadow-sm shrink-0">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={onGoHome}
            className="flex items-center gap-2 text-charcoal-500 hover:text-charcoal-900 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>

          <div className="h-6 w-px bg-charcoal-300"></div>

          <h1 className="text-lg font-semibold text-charcoal-800">
            {data.targetJob?.title ? `${data.targetJob.title} Resume - ` : 'Resume - '}
            {new Date().getFullYear()}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {activeTab === 'resume' && (
            <label className="flex items-center gap-3 text-sm font-semibold text-charcoal-600 cursor-pointer hover:text-charcoal-900 transition-colors bg-charcoal-50 px-4 py-2 rounded-full border border-charcoal-200">
              <span className="text-xs tracking-widest uppercase">ATS STRICT MODE</span>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${data.isATSStrict ? 'bg-[#FF6B35]' : 'bg-charcoal-300'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={data.isATSStrict || false}
                  onChange={(e) => onUpdate({ ...data, isATSStrict: e.target.checked })}
                  className="sr-only"
                />
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.isATSStrict ? 'translate-x-4' : 'translate-x-1'
                    }`}
                />
              </div>
            </label>
          )}

          <button
            type="button"
            onClick={activeTab === 'resume' ? handleWordExport : handleCoverLetterExport}
            disabled={isExporting || (activeTab !== 'resume' && !onExportCoverLetter)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-charcoal-700 bg-white border border-charcoal-300 rounded-md hover:bg-charcoal-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <FileText size={16} />
            Download Word
          </button>

          <button
            type="button"
            onClick={handlePDFExport}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF6B35] rounded-md hover:bg-[#E85D2B] shadow-sm transition-colors"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Left Sidebar */}
        <aside className="w-[280px] bg-white border-r border-charcoal-100 overflow-y-auto no-print flex-shrink-0">
          <div className="p-6">
            <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-4">Select Template</h2>
            <div className="flex flex-col gap-1">
              {Object.values(templateRegistry).map(t => {
                const isActive = templateId === t.id && activeTab === 'resume';
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setActiveTab('resume');
                      onUpdate({ ...data, template: t.id });
                    }}
                    className={`relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${isActive
                      ? 'bg-[#FFF5F2] text-[#FF6B35] border border-[#FFD8CC]'
                      : 'text-charcoal-600 border border-transparent hover:bg-charcoal-50'
                      }`}
                  >
                    <div className={isActive ? 'text-[#FF6B35]' : 'text-charcoal-400'}>
                      {getTemplateIcon(t.id)}
                    </div>
                    <span className={`text-sm font-semibold ${isActive ? 'text-charcoal-900' : ''}`}>
                      {t.displayName}
                    </span>
                  </button>
                );
              })}
            </div>

            {data.coverLetter && (
              <>
                <div className="my-6 border-t border-charcoal-100"></div>
                <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-4">Documents</h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('coverLetter')}
                  className={`relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${activeTab === 'coverLetter'
                    ? 'bg-[#FFF5F2] text-[#FF6B35] border border-[#FFD8CC]'
                    : 'text-charcoal-600 border border-transparent hover:bg-charcoal-50'
                    }`}
                >
                  <div className={activeTab === 'coverLetter' ? 'text-[#FF6B35]' : 'text-charcoal-400'}>
                    <FileCheck size={18} />
                  </div>
                  <span className={`text-sm font-semibold ${activeTab === 'coverLetter' ? 'text-charcoal-900' : ''}`}>
                    Cover Letter
                  </span>
                </button>
              </>
            )}

          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-charcoal-50 overflow-y-auto relative print:overflow-visible print:block print:bg-white">
          <div className="py-12 flex justify-center print:py-0 print:block">
            {/* Resume Preview */}
            <div
              id="resume-preview"
              className={`w-[210mm] min-h-[297mm] bg-white shadow-xl p-[15mm] text-left shrink-0
                         print:shadow-none print:w-full print:min-h-0 print:h-auto print:p-[15mm] print:mx-0
                         flex flex-col ${activeTab !== 'resume' ? 'hidden print:hidden' : ''}
                         ${activeTypography.fontFamily} ${activeTypography.baseSize} ${activeTypography.lineHeight} ${activeColors.text}`}
            >
              {/* Header */}
              <header className={`${template.spacing.sectionGap} break-inside-avoid pb-4 ${activeDivider === 'line' ? 'border-b-2 ' + activeColors.divider : ''} ${template.layout.headerAlignment === 'center' ? 'text-center' : ''}`}>
                <EditableElement
                  as="h1"
                  value={data.personalInfo.fullName}
                  onSave={(val) => onUpdate({ ...data, personalInfo: { ...data.personalInfo, fullName: val } })}
                  className={`${activeTypography.headingWeight} ${template.layout.nameStyle === 'uppercase' ? 'uppercase tracking-widest' : template.layout.nameStyle === 'bold' ? 'tracking-tight' : ''} ${activeColors.primary} mb-2 break-words block text-3xl md:text-4xl`}
                  placeholder="YOUR NAME"
                  readOnly={readOnly}
                />

                <div className={`flex flex-wrap gap-4 mt-2 ${activeTypography.baseSize} ${activeColors.muted} ${template.layout.headerAlignment === 'center' ? 'justify-center' : ''}`}>
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
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Professional Summary
                  </h3>
                  <EditableElement
                    as="p"
                    multiline
                    value={data.summary || ''}
                    onSave={(val) => onUpdate({ ...data, summary: val })}
                    className="text-sm leading-relaxed text-charcoal-800 text-justify break-words whitespace-pre-line"
                    placeholder="Add a professional summary..."
                    readOnly={readOnly}
                  />
                </section>
              )}


              {/* Experience */}
              {(!data.visibleSections || data.visibleSections.includes('experience')) && data.experience.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Experience
                  </h3>
                  <div className={template.spacing.itemGap}>
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
                            className="font-bold text-charcoal-900 text-base mr-2"
                            placeholder="Role"
                            readOnly={readOnly}
                          />
                          <div className="flex gap-1 text-sm text-charcoal-600 font-medium whitespace-nowrap">
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
                          className="text-sm font-semibold text-charcoal-700 italic mb-2 block"
                          placeholder="Company"
                          readOnly={readOnly}
                        />
                        <ul className="list-disc ml-5 space-y-1">
                          {exp.refinedBullets && exp.refinedBullets.length > 0 ? (
                            exp.refinedBullets.map((bullet, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-charcoal-800 leading-snug pl-1 break-words"
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
                            <div className="text-sm text-charcoal-800 leading-snug pl-1 whitespace-pre-line">
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
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Projects
                  </h3>
                  <div className={template.spacing.itemGap}>
                    {data.projects.map(project => (
                      <div key={project.id}>
                        <div className="flex justify-between items-baseline mb-1 flex-wrap">
                          <h4 className="font-bold text-charcoal-900 text-base mr-2 flex items-center gap-2">
                            {project.name}
                            {project.link && (
                              <a
                                href={project.link.startsWith('http') ? project.link : `https://${project.link}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-normal text-brand-600 hover:text-brand-800 hover:underline inline-flex items-center gap-1"
                              >
                                <Globe size={12} /> View Project
                              </a>
                            )}
                          </h4>
                        </div>
                        {project.technologies && (
                          <div className="text-sm text-charcoal-700 italic mb-1">
                            Technologies: {project.technologies}
                          </div>
                        )}
                        <p className="text-sm text-charcoal-800 leading-relaxed whitespace-pre-line">
                          {project.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {(!data.visibleSections || data.visibleSections.includes('education')) && data.education.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Education
                  </h3>
                  <div className={template.spacing.itemGap}>
                    {data.education.map(edu => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline flex-wrap">
                          <h4 className="font-bold text-charcoal-900 mr-2">{edu.school}</h4>
                          <span className="text-sm text-charcoal-600 font-medium whitespace-nowrap">
                            {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                          </span>
                        </div>
                        <div className="text-sm text-charcoal-700">
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
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Certifications
                  </h3>
                  <div className={template.spacing.itemGap}>
                    {data.certifications.map(cert => (
                      <div key={cert.id}>
                        <div className="flex justify-between items-baseline flex-wrap">
                          <h4 className="font-bold text-charcoal-900 mr-2">
                            {cert.name}
                            {cert.link && (
                              <a href={cert.link} target="_blank" rel="noreferrer" className="ml-2 text-brand-600 hover:underline text-xs font-normal">Link</a>
                            )}
                          </h4>
                          <span className="text-sm text-charcoal-600 font-medium whitespace-nowrap">
                            {cert.date}
                          </span>
                        </div>
                        <div className="text-sm text-charcoal-700 font-medium">{cert.issuer}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Extracurriculars */}
              {(!data.visibleSections || data.visibleSections.includes('extracurriculars')) && data.extracurriculars && data.extracurriculars.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Extracurricular Activities
                  </h3>
                  <div className={template.spacing.itemGap}>
                    {data.extracurriculars.map(activity => (
                      <div key={activity.id}>
                        <div className="flex justify-between items-baseline mb-1 flex-wrap">
                          <h4 className="font-bold text-charcoal-900 text-base mr-2">{activity.title}</h4>
                          <span className="text-sm text-charcoal-600 font-medium whitespace-nowrap">
                            {activity.startDate} – {activity.endDate}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-charcoal-700 italic mb-1">
                          {activity.organization}
                        </div>
                        {activity.refinedBullets && activity.refinedBullets.length > 0 ? (
                          <ul className="list-disc ml-5 space-y-1">
                            {activity.refinedBullets.map((bullet, i) => (
                              <li key={i} className="text-sm text-charcoal-800 leading-snug pl-1">{bullet}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-charcoal-800 whitespace-pre-line">
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
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>Awards & Honors</h3>
                  <ul className={template.spacing.itemGap}>
                    {data.awards.map(award => (
                      <li key={award.id}>
                        <div className="flex justify-between items-baseline">
                          <span className="font-bold text-charcoal-900 text-sm">{award.title}</span>
                          <span className="text-sm text-charcoal-600">{award.date}</span>
                        </div>
                        <div className="text-sm text-charcoal-700">{award.issuer} {award.description ? `- ${award.description}` : ''}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Publications */}
              {(!data.visibleSections || data.visibleSections.includes('publications')) && data.publications && data.publications.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>Publications</h3>
                  <div className={template.spacing.itemGap}>
                    {data.publications.map(pub => (
                      <div key={pub.id} className="text-sm text-charcoal-800">
                        <span className="font-bold">{pub.title}</span>, {pub.publisher}, {pub.date}.
                        {pub.link && (
                          <a href={pub.link} target="_blank" rel="noreferrer" className="ml-1 text-brand-600 hover:underline">[Link]</a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Affiliations */}
              {(!data.visibleSections || data.visibleSections.includes('affiliations')) && data.affiliations && data.affiliations.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>Affiliations</h3>
                  <ul className={`list-disc ml-5 ${template.spacing.itemGap}`}>
                    {data.affiliations.map(aff => (
                      <li key={aff.id} className="text-sm text-charcoal-800">
                        <span className="font-semibold">{aff.role}</span>, {aff.organization} ({aff.startDate} – {aff.endDate})
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Skills */}
              {(!data.visibleSections || data.visibleSections.includes('skills')) && data.skills.length > 0 && (
                <section className={template.spacing.sectionGap}>
                  <h3 className={sectionHeaderClass}>
                    Skills
                  </h3>
                  {template.layout.skillStyle === 'tags' ? (
                    <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, i) => (
                        <span key={i} className={`px-2 py-1 text-xs border rounded-md ${activeColors.muted} border-charcoal-200`}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-sm ${activeColors.text} ${activeTypography.lineHeight} break-words`}>
                      {data.skills.join(' • ')}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Cover Letter Preview */}
            {
              data.coverLetter && (
                <div
                  id="cover-letter-preview"
                  className={`w-[210mm] min-h-[297mm] bg-white shadow-xl p-[15mm] text-left shrink-0
                     print:shadow-none print:w-full print:min-h-0 print:h-auto print:p-[15mm] print:mx-0
                     flex flex-col ${activeTab !== 'coverLetter' ? 'hidden print:hidden' : ''}`}
                  style={{ color: '#000' }}
                >
                  {/* Header */}
                  <div className="mb-8 break-inside-avoid">
                    <div className="flex flex-wrap gap-2 text-sm text-charcoal-600 mb-4">
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
                    <div className="text-sm text-charcoal-600 mb-4">
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    {data.targetJob.company && (
                      <div className="text-sm text-charcoal-800 mb-2">
                        {data.targetJob.company}
                      </div>
                    )}
                    <div className="text-sm text-charcoal-800 mb-6">
                      Hiring Manager
                    </div>
                  </div>

                  {/* Cover Letter Body */}
                  <div className="flex-1 text-sm leading-relaxed text-charcoal-800 whitespace-pre-line break-words">
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
          </div>
        </main>
      </div>

      <p className="hidden text-xs text-charcoal-400 no-print">
        Tip: For PDF, use "Save as PDF" in the print dialog. Uncheck "Headers and
        footers".
      </p>
    </div>
  );
};


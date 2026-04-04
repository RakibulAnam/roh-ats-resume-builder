// Presentation Layer - Preview Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import html2pdf from 'html2pdf.js';
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
  ArrowLeft,
  Github,
  FileCheck,
  Award,
  Grid,
  File,
  Terminal,
  RefreshCw,
  Lock,
  Loader2,
} from 'lucide-react';
import { EditableElement } from './EditableElement';

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  const s = dateString.toLowerCase();
  if (s === 'present' || s === 'current') return 'Present';

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
  isGeneralResume?: boolean;
  onRegenerate?: () => Promise<void>;
  canRegenerate?: boolean;
  cooldownEndsAt?: Date | null;
}

export const Preview: React.FC<PreviewProps> = ({
  data,
  onUpdate,
  onExportWord,
  onExportCoverLetter,
  onGoHome,
  readOnly = false,
  isGeneralResume = false,
  onRegenerate,
  canRegenerate = true,
  cooldownEndsAt,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'resume' | 'coverLetter'>('resume');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cooldownText, setCooldownText] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const pdfCloneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cooldownEndsAt || canRegenerate) {
      setCooldownText(null);
      return;
    }

    const updateCooldownText = () => {
      const now = new Date();
      const diffStr = cooldownEndsAt.getTime() - now.getTime();
      if (diffStr <= 0) {
        setCooldownText(null);
        return;
      }
      const hours = Math.floor(diffStr / (1000 * 60 * 60));
      const minutes = Math.floor((diffStr % (1000 * 60 * 60)) / (1000 * 60));
      setCooldownText(`Regeneration locked. Try again in ${hours}h ${minutes}m`);
    };

    updateCooldownText();
    const interval = setInterval(updateCooldownText, 60000);
    return () => clearInterval(interval);
  }, [cooldownEndsAt, canRegenerate]);

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

  const generatePDF = useCallback(async (element: HTMLElement, fileName: string) => {
    const opt = {
      margin: 0,
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        onclone: (clonedDoc: Document) => {
          const skillBoxes = clonedDoc.querySelectorAll('.skill-tag-box');
          skillBoxes.forEach(box => {
            const el = box as HTMLElement;
            el.style.display = 'inline-block';
            el.style.height = 'auto';
            el.style.lineHeight = 'normal';
            el.style.padding = '4px 10px';
            el.style.fontSize = '11px';
            el.style.border = '1px solid #e5e7eb';
            el.style.borderRadius = '6px';
            el.style.color = '#4b5563';
            el.style.whiteSpace = 'nowrap';
            el.style.boxSizing = 'border-box';
            el.style.verticalAlign = 'top';
            el.style.marginRight = '8px';
            el.style.marginBottom = '8px';

            const textSpan = el.querySelector('.pdf-skill-text') as HTMLElement;
            if (textSpan) {
              textSpan.style.display = 'inline';
              textSpan.style.position = 'static';
              textSpan.style.lineHeight = 'normal';
            }
          });

          const skillsContainer = clonedDoc.querySelector('.skills-container') as HTMLElement;
          if (skillsContainer) {
            skillsContainer.style.display = 'block';
          }
        },
      },
      jsPDF: {
        unit: 'mm' as const,
        format: 'a4' as const,
        orientation: 'portrait' as const,
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };

    await html2pdf().set(opt).from(element).save();
  }, []);

  const handlePDFExport = async () => {
    if (isPdfGenerating) return;
    setIsPdfGenerating(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      const cloneContainer = pdfCloneRef.current;
      if (!cloneContainer) {
        throw new Error('PDF clone container not found');
      }

      const sourceId = activeTab === 'resume' ? 'resume-source' : 'cover-letter-source';
      const sourceEl = document.getElementById(sourceId);
      if (!sourceEl) {
        throw new Error('Source element not found');
      }

      cloneContainer.innerHTML = '';
      const clone = sourceEl.cloneNode(true) as HTMLElement;

      const styleOverride = document.createElement('style');
      styleOverride.textContent = `
        #${sourceId} {
          min-height: 0 !important;
          height: auto !important;
          display: block !important;
          overflow: visible !important;
        }
        #${sourceId} section {
          break-inside: auto !important;
        }
        .break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .page-break-inside-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .contact-item {
          display: inline-flex !important;
          align-items: center !important;
          vertical-align: middle !important;
          gap: 0.375rem !important;
        }
        .contact-icon {
          display: inline-block !important;
          vertical-align: middle !important;
          line-height: 1 !important;
          font-size: 14px !important;
        }
        .skills-container {
          display: block !important;
        }
        .skill-tag-box {
          display: inline-block !important;
          margin-right: 8px !important;
          margin-bottom: 8px !important;
          padding: 4px 10px !important;
          font-size: 11px !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 6px !important;
          color: #4b5563 !important;
          white-space: nowrap !important;
          box-sizing: border-box !important;
          height: auto !important;
          line-height: normal !important;
          vertical-align: middle !important;
        }
        .pdf-skill-text {
          display: inline !important;
          line-height: normal !important;
          position: static !important;
        }
      `;
      clone.insertBefore(styleOverride, clone.firstChild);

      clone.style.position = 'relative';
      clone.style.left = '0';
      clone.style.top = '0';
      clone.style.visibility = 'visible';
      clone.style.opacity = '1';
      cloneContainer.appendChild(clone);

      await new Promise(resolve => setTimeout(resolve, 200));

      const fileName = activeTab === 'resume'
        ? `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.pdf`
        : `${data.personalInfo.fullName.replace(/\s+/g, '_')}_CoverLetter.pdf`;

      await generatePDF(clone, fileName);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPdfGenerating(false);
      if (pdfCloneRef.current) {
        pdfCloneRef.current.innerHTML = '';
      }
    }
  };

  const getTemplateIcon = (id: string) => {
    switch (id) {
      case 'executive': return <Award size={18} />;
      case 'minimal': return <File size={18} />;
      case 'compact': return <Grid size={18} />;
      case 'technical': return <Terminal size={18} />;
      case 'classic':
      default: return <FileText size={18} />;
    }
  };

  const resumeContent = (
    <div
      id="resume-source"
      className={`w-[210mm] min-h-[297mm] bg-white p-[15mm] text-left
                 flex flex-col ${activeTypography.fontFamily} ${activeTypography.baseSize} ${activeTypography.lineHeight} ${activeColors.text}`}
    >
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
            <div className="contact-item">
              <span className="contact-icon">✉</span>
              <span className="break-all">{data.personalInfo.email}</span>
            </div>
          )}
          {data.personalInfo.phone && (
            <div className="contact-item">
              <span className="contact-icon">☎</span>
              <span>{data.personalInfo.phone}</span>
            </div>
          )}
          {data.personalInfo.location && (
            <div className="contact-item">
              <span className="contact-icon">⌂</span>
              <span>{data.personalInfo.location}</span>
            </div>
          )}
          {data.personalInfo.linkedin && (
            <div className="contact-item">
              <span className="contact-icon" style={{ fontWeight: 'bold', fontSize: '11px' }}>in</span>
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
            <div className="contact-item">
              <span className="contact-icon">⌘</span>
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
            <div className="contact-item">
              <span className="contact-icon">⊕</span>
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


      {(!data.visibleSections || data.visibleSections.includes('experience')) && data.experience.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Experience
          </h3>
          <div className={template.spacing.itemGap}>
            {data.experience.map((exp, expIdx) => (
              <div key={exp.id} className="break-inside-avoid page-break-inside-avoid">
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
                        newExp[expIdx] = { ...newExp[expIdx], endDate: val, isCurrent: val.toLowerCase() === 'present' };
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

      {(!data.visibleSections || data.visibleSections.includes('projects')) && data.projects && data.projects.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Projects
          </h3>
          <div className={template.spacing.itemGap}>
            {data.projects.map(project => (
              <div key={project.id} className="break-inside-avoid page-break-inside-avoid">
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

      {(!data.visibleSections || data.visibleSections.includes('education')) && data.education.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Education
          </h3>
          <div className={template.spacing.itemGap}>
            {data.education.map(edu => (
              <div key={edu.id} className="break-inside-avoid page-break-inside-avoid">
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

      {(!data.visibleSections || data.visibleSections.includes('certifications')) && data.certifications && data.certifications.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Certifications
          </h3>
          <div className={template.spacing.itemGap}>
            {data.certifications.map(cert => (
              <div key={cert.id} className="break-inside-avoid page-break-inside-avoid">
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

      {(!data.visibleSections || data.visibleSections.includes('extracurriculars')) && data.extracurriculars && data.extracurriculars.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Extracurricular Activities
          </h3>
          <div className={template.spacing.itemGap}>
            {data.extracurriculars.map(activity => (
              <div key={activity.id} className="break-inside-avoid page-break-inside-avoid">
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

      {(!data.visibleSections || data.visibleSections.includes('awards')) && data.awards && data.awards.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>Awards & Honors</h3>
          <ul className={template.spacing.itemGap}>
            {data.awards.map(award => (
              <li key={award.id} className="break-inside-avoid page-break-inside-avoid">
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

      {(!data.visibleSections || data.visibleSections.includes('publications')) && data.publications && data.publications.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>Publications</h3>
          <div className={template.spacing.itemGap}>
            {data.publications.map(pub => (
              <div key={pub.id} className="text-sm text-charcoal-800 break-inside-avoid page-break-inside-avoid">
                <span className="font-bold">{pub.title}</span>, {pub.publisher}, {pub.date}.
                {pub.link && (
                  <a href={pub.link} target="_blank" rel="noreferrer" className="ml-1 text-brand-600 hover:underline">[Link]</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(!data.visibleSections || data.visibleSections.includes('affiliations')) && data.affiliations && data.affiliations.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>Affiliations</h3>
          <ul className={`list-disc ml-5 ${template.spacing.itemGap}`}>
            {data.affiliations.map(aff => (
              <li key={aff.id} className="text-sm text-charcoal-800 break-inside-avoid page-break-inside-avoid">
                <span className="font-semibold">{aff.role}</span>, {aff.organization} ({aff.startDate} – {aff.endDate})
              </li>
            ))}
          </ul>
        </section>
      )}

      {(!data.visibleSections || data.visibleSections.includes('skills')) && data.skills.length > 0 && (
        <section className={template.spacing.sectionGap}>
          <h3 className={sectionHeaderClass}>
            Skills
          </h3>
          {template.layout.skillStyle === 'tags' ? (
            <div className="skills-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data.skills.map((skill, i) => (
                <div key={i} className="skill-tag-box">
                  <span className="pdf-skill-text">{skill}</span>
                </div>
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
  );

  const coverLetterContent = data.coverLetter && (
    <div
      id="cover-letter-source"
      className={`w-[210mm] min-h-[297mm] bg-white p-[15mm] text-left
         flex flex-col font-serif text-[11pt] leading-relaxed`}
      style={{ color: '#1F2937' }}
    >
      <div className="mb-6 break-inside-avoid">
        <div className="font-bold text-base text-charcoal-900">{data.personalInfo.fullName}</div>
        <div className="text-sm text-charcoal-600 mt-1 space-y-0.5">
          {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
          {data.personalInfo.linkedin && (
            <div>{data.personalInfo.linkedin}</div>
          )}
        </div>
      </div>

      <div className="mb-6 text-sm text-charcoal-800">
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      <div className="mb-6 text-sm text-charcoal-800 break-inside-avoid">
        <div>Hiring Manager</div>
        {data.targetJob.company && <div>{data.targetJob.company}</div>}
      </div>

      <div className="mb-4 text-sm text-charcoal-900">
        Dear Hiring Manager,
      </div>

      <div className="flex-1 space-y-4">
        {data.coverLetter
          .split(/\n\s*\n/)
          .filter(p => p.trim().length > 0)
          .map((paragraph, idx) => (
            <p
              key={idx}
              className="text-sm leading-relaxed text-charcoal-800 text-justify"
            >
              {paragraph.trim()}
            </p>
          ))}
      </div>

      <div className="mt-8 break-inside-avoid">
        <div className="text-sm text-charcoal-800 mb-6">Sincerely,</div>
        <div className="font-bold text-charcoal-900">{data.personalInfo.fullName}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-charcoal-50 overflow-hidden">
      <style>{`
        .contact-item {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
        }
        .contact-icon {
          display: inline-block;
          vertical-align: middle;
          line-height: 1;
          font-size: 14px;
        }
        .skill-tag {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          height: 1.5rem;
          vertical-align: middle;
        }
        .skill-tag-wrapper {
          display: inline-block;
          vertical-align: middle;
        }
        .skill-tag-wrapper span {
          display: inline-block;
          line-height: 1;
          vertical-align: middle;
        }
        .skill-tag-box {
          display: inline-block;
          height: 22px;
          line-height: 20px;
          padding: 0 10px;
          fontSize: 11px;
          border: 1px solid #e5e7eb;
          borderRadius: 6px;
          color: #4b5563;
          whiteSpace: nowrap;
          boxSizing: border-box;
          vertical-align: middle;
        }
        .pdf-skill-text {
          display: inline-block;
          line-height: 1;
        }
      `}</style>
      {/* Hidden PDF clone container */}
      <div
        ref={pdfCloneRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '210mm',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-10 flex flex-col md:flex-row items-start md:items-center justify-between px-4 md:px-6 py-4 bg-white border-b border-charcoal-200 shadow-sm shrink-0 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto md:justify-start gap-4 md:gap-6">
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

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end flex-wrap overflow-x-auto scrollbar-hide">
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

          {isGeneralResume && (
            <button
              type="button"
              onClick={async () => {
                if (onRegenerate) {
                  setIsRegenerating(true);
                  try {
                    await onRegenerate();
                  } finally {
                    setIsRegenerating(false);
                  }
                }
              }}
              disabled={!canRegenerate || isRegenerating}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border shadow-sm transition-colors
                disabled:opacity-50
                bg-white border-brand-200 text-brand-700 hover:bg-brand-50"
              title={cooldownText || 'Regenerate General Resume'}
            >
              {isRegenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : !canRegenerate ? (
                <Lock size={16} className="text-brand-400" />
              ) : (
                <RefreshCw size={16} />
              )}
              {!canRegenerate ? 'Regenerate Locked' : 'Regenerate'}
            </button>
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
            disabled={isPdfGenerating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF6B35] rounded-md hover:bg-[#E85D2B] shadow-sm transition-colors disabled:opacity-50"
          >
            {isPdfGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isPdfGenerating ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-full md:w-[280px] bg-white border-b md:border-b-0 md:border-r border-charcoal-100 overflow-x-auto md:overflow-y-auto flex-shrink-0 scrollbar-hide">
          <div className="p-4 md:p-6 flex flex-row md:flex-col gap-6">
            <div>
              <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-3">Select Template</h2>
              <div className="flex flex-row md:flex-col gap-2 min-w-max md:min-w-0">
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
            </div>

            {data.coverLetter && (
              <div className="flex items-center md:items-start md:flex-col gap-4 md:gap-0">
                <div className="hidden md:block my-6 border-t border-charcoal-100 w-full"></div>
                <div className="mx-2 md:hidden h-8 w-px bg-charcoal-200 self-center"></div>
                <div>
                  <h2 className="text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-3">Documents</h2>
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
                </div>
              </div>
            )}

          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-charcoal-50 overflow-auto relative">
          <div className="p-4 md:py-12 flex justify-center min-w-max md:min-w-0">
            {activeTab === 'resume' ? resumeContent : coverLetterContent}
          </div>
        </main>
      </div>

      <p className="hidden text-xs text-charcoal-400">
        Tip: Click "Download PDF" to generate a pixel-perfect PDF of your resume.
      </p>
    </div>
  );
};

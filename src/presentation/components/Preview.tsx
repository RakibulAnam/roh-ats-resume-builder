// Presentation Layer - Preview Component
//
// Renders the resume on screen using the SAME numeric values (in pt) that
// the PDF exporter consumes, so what the user sees is what they download.
// All variants are single-column, real-text, no icons / no tables — i.e.
// structurally ATS-safe regardless of which template the user picks.

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ResumeData, ToolkitItem } from '../../domain/entities/Resume';
import {
  templateRegistry,
  resolveTemplate,
  TemplateDefinition,
} from '../templates/TemplateRegistry';
import {
  Download,
  FileText,
  ArrowLeft,
  FileCheck,
  RefreshCw,
  Lock,
  Loader2,
  Mail,
  Linkedin,
  MessageSquare,
  AlertTriangle,
  Circle,
} from 'lucide-react';
import { EditableElement } from './EditableElement';
import {
  OutreachEmailViewer,
  LinkedInMessageViewer,
  InterviewPrepViewer,
  ToolkitStatusCard,
  ToolkitItemStatus,
} from './Builder/ToolkitViewers';

type PreviewTab = 'resume' | 'coverLetter' | 'outreachEmail' | 'linkedInMessage' | 'interviewPrep';

const getItemStatus = (
  data: ResumeData,
  item: ToolkitItem,
  regeneratingItem: ToolkitItem | null,
): ToolkitItemStatus => {
  if (regeneratingItem === item) return 'regenerating';
  if (data.toolkit?.errors?.[item]) return 'failed';
  switch (item) {
    case 'coverLetter':
      return data.coverLetter ? 'success' : 'missing';
    case 'outreachEmail':
      return data.toolkit?.outreachEmail ? 'success' : 'missing';
    case 'linkedInMessage':
      return data.toolkit?.linkedInMessage ? 'success' : 'missing';
    case 'interviewQuestions':
      return (data.toolkit?.interviewQuestions?.length ?? 0) > 0 ? 'success' : 'missing';
  }
};

const StatusDot: React.FC<{ status: ToolkitItemStatus }> = ({ status }) => {
  if (status === 'success') {
    return null;
  }
  if (status === 'regenerating') {
    return <Loader2 size={12} className="animate-spin text-brand-500 shrink-0" />;
  }
  if (status === 'failed') {
    return <AlertTriangle size={12} className="text-red-600 shrink-0" aria-label="Generation failed" />;
  }
  return <Circle size={10} className="text-charcoal-400 shrink-0" aria-label="Not generated" />;
};

// A4 page dimensions in points (matches PDF exporter exactly)
const PAGE_WIDTH_PT = 595.28;
const PAGE_HEIGHT_PT = 841.89;

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
  onExportPDF: (data: ResumeData) => Promise<void>;
  onExportCoverLetter?: (data: ResumeData) => Promise<void>;
  onExportCoverLetterPDF?: (data: ResumeData) => Promise<void>;
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
  onExportPDF,
  onExportCoverLetter,
  onExportCoverLetterPDF,
  onGoHome,
  readOnly = false,
  isGeneralResume = false,
  onRegenerate,
  canRegenerate = true,
  cooldownEndsAt,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<PreviewTab>('resume');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [cooldownText, setCooldownText] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

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

  const template: TemplateDefinition = resolveTemplate(data.template);

  // Build a plain pipe-separated contact line. Mirrors the PDF exporter
  // exactly. Avoids Unicode icons (✉ ☎ ⌂ ⌘ ⊕) which can confuse some ATS
  // parsers and which the PDF deliberately does not include.
  const contactParts = [
    data.personalInfo.email,
    data.personalInfo.phone,
    data.personalInfo.location,
    data.personalInfo.linkedin,
    data.personalInfo.github,
    data.personalInfo.website,
  ].filter(Boolean) as string[];

  // Wrapper sheet — A4 in pt. Padding = template.margin pt on all sides.
  const sheetStyle: React.CSSProperties = {
    width: `${PAGE_WIDTH_PT}pt`,
    minHeight: `${PAGE_HEIGHT_PT}pt`,
    padding: `${template.margin}pt`,
    backgroundColor: '#fff',
    color: '#000',
    fontFamily: template.cssFont,
    fontSize: `${template.sizeBody}pt`,
    lineHeight: template.lineHeight,
    boxSizing: 'border-box',
  };

  const headerStyle: React.CSSProperties = {
    textAlign: template.headerAlignment,
    marginBottom: `${template.sectionGapBefore}pt`,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: `${template.sizeName}pt`,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.1,
    letterSpacing: template.nameStyle === 'uppercase' ? '0.06em' : 'normal',
    textTransform: template.nameStyle === 'uppercase' ? 'uppercase' : 'none',
  };

  const contactLineStyle: React.CSSProperties = {
    fontSize: `${template.sizeBody}pt`,
    marginTop: `${template.sizeBody * 0.4}pt`,
    color: '#000',
    wordBreak: 'break-word',
  };

  const sectionStyle: React.CSSProperties = {
    marginTop: `${template.sectionGapBefore}pt`,
  };

  const sectionHeadingStyle: React.CSSProperties = {
    fontSize: `${template.sizeHeading}pt`,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
    paddingBottom:
      template.sectionDivider === 'rule' ? `${template.headingGapAfter / 2}pt` : 0,
    borderBottom:
      template.sectionDivider === 'rule' ? '0.6pt solid #000' : 'none',
    marginBottom: `${template.headingGapAfter}pt`,
  };

  const itemBlockStyle: React.CSSProperties = {
    marginBottom: `${template.itemGap}pt`,
  };

  const itemTitleRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: '8pt',
  };

  const itemTitleStyle: React.CSSProperties = {
    fontSize: `${template.sizeItemTitle}pt`,
    fontWeight: 700,
    margin: 0,
  };

  const itemMetaStyle: React.CSSProperties = {
    fontSize: `${template.sizeMeta}pt`,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  };

  const italicLineStyle: React.CSSProperties = {
    fontSize: `${template.sizeMeta}pt`,
    fontStyle: 'italic',
    margin: `2pt 0 ${template.bulletGap + 2}pt 0`,
  };

  const bulletListStyle: React.CSSProperties = {
    listStyleType: 'disc',
    paddingLeft: '14pt',
    margin: 0,
  };

  const bulletItemStyle: React.CSSProperties = {
    fontSize: `${template.sizeBody}pt`,
    marginBottom: `${template.bulletGap}pt`,
    lineHeight: template.lineHeight,
  };

  const bodyTextStyle: React.CSSProperties = {
    fontSize: `${template.sizeBody}pt`,
    margin: `2pt 0`,
    whiteSpace: 'pre-line',
  };

  const isVisible = (key: string) =>
    !data.visibleSections || data.visibleSections.includes(key);

  // ────────────────────────────────────────────────────────────
  // EXPORT HANDLERS
  // ────────────────────────────────────────────────────────────

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

  const handlePDFExport = async () => {
    if (isPdfGenerating) return;

    if (activeTab === 'coverLetter' && !onExportCoverLetterPDF) {
      toast.error('Cover letter PDF export is not available.');
      return;
    }

    setIsPdfGenerating(true);
    try {
      if (activeTab === 'resume') {
        await onExportPDF(data);
      } else if (onExportCoverLetterPDF) {
        await onExportCoverLetterPDF(data);
      }
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  // RESUME BODY (mirrors PdfResumeExporter section by section)
  // ────────────────────────────────────────────────────────────

  const resumeContent = (
    <div id="resume-source" style={sheetStyle}>
      {/* Header — name + plain pipe-separated contact line (no icons) */}
      <header style={headerStyle}>
        <EditableElement
          as="h1"
          value={data.personalInfo.fullName}
          onSave={(val) =>
            onUpdate({
              ...data,
              personalInfo: { ...data.personalInfo, fullName: val },
            })
          }
          style={nameStyle}
          placeholder="YOUR NAME"
          readOnly={readOnly}
        />
        {contactParts.length > 0 && (
          <div style={contactLineStyle}>{contactParts.join('  |  ')}</div>
        )}
      </header>

      {data.summary && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Professional Summary</h3>
          <EditableElement
            as="p"
            multiline
            value={data.summary || ''}
            onSave={(val) => onUpdate({ ...data, summary: val })}
            style={{
              fontSize: `${template.sizeBody}pt`,
              lineHeight: template.lineHeight,
              margin: 0,
              whiteSpace: 'pre-line',
            }}
            placeholder="Add a professional summary..."
            readOnly={readOnly}
          />
        </section>
      )}

      {isVisible('experience') && data.experience.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Experience</h3>
          {data.experience.map((exp, expIdx) => (
            <div key={exp.id} style={itemBlockStyle}>
              <div style={itemTitleRowStyle}>
                <EditableElement
                  as="h4"
                  value={exp.role}
                  onSave={(val) => {
                    const newExp = [...data.experience];
                    newExp[expIdx] = { ...newExp[expIdx], role: val };
                    onUpdate({ ...data, experience: newExp });
                  }}
                  style={itemTitleStyle}
                  placeholder="Role"
                  readOnly={readOnly}
                />
                <span style={itemMetaStyle}>
                  {formatDate(exp.startDate)} –{' '}
                  {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                </span>
              </div>
              <EditableElement
                value={exp.company}
                onSave={(val) => {
                  const newExp = [...data.experience];
                  newExp[expIdx] = { ...newExp[expIdx], company: val };
                  onUpdate({ ...data, experience: newExp });
                }}
                style={italicLineStyle}
                placeholder="Company"
                readOnly={readOnly}
              />
              {exp.refinedBullets && exp.refinedBullets.length > 0 ? (
                <ul style={bulletListStyle}>
                  {exp.refinedBullets.map((bullet, idx) => (
                    <li key={idx} style={bulletItemStyle}>
                      <EditableElement
                        multiline
                        value={bullet}
                        onSave={(val) => {
                          const newExp = [...data.experience];
                          const newBullets = [
                            ...(newExp[expIdx].refinedBullets || []),
                          ];
                          newBullets[idx] = val;
                          newExp[expIdx] = {
                            ...newExp[expIdx],
                            refinedBullets: newBullets,
                          };
                          onUpdate({ ...data, experience: newExp });
                        }}
                        readOnly={readOnly}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EditableElement
                  multiline
                  value={exp.rawDescription || ''}
                  onSave={(val) => {
                    const newExp = [...data.experience];
                    newExp[expIdx] = { ...newExp[expIdx], rawDescription: val };
                    onUpdate({ ...data, experience: newExp });
                  }}
                  placeholder="No description provided. Click to add one."
                  style={{ ...bodyTextStyle, fontStyle: 'italic' }}
                  readOnly={readOnly}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {isVisible('projects') && data.projects && data.projects.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Projects</h3>
          {data.projects.map((project, projIdx) => (
            <div key={project.id} style={itemBlockStyle}>
              <div style={itemTitleRowStyle}>
                <h4 style={itemTitleStyle}>{project.name}</h4>
                {project.technologies && (
                  <span style={itemMetaStyle}>{project.technologies}</span>
                )}
              </div>
              {project.link && (
                <div style={{ ...italicLineStyle, fontStyle: 'normal' }}>
                  {project.link}
                </div>
              )}
              {project.refinedBullets && project.refinedBullets.length > 0 ? (
                <ul style={bulletListStyle}>
                  {project.refinedBullets.map((bullet, idx) => (
                    <li key={idx} style={bulletItemStyle}>
                      <EditableElement
                        multiline
                        value={bullet}
                        onSave={(val) => {
                          const newProjects = [...data.projects];
                          const newBullets = [
                            ...(newProjects[projIdx].refinedBullets || []),
                          ];
                          newBullets[idx] = val;
                          newProjects[projIdx] = {
                            ...newProjects[projIdx],
                            refinedBullets: newBullets,
                          };
                          onUpdate({ ...data, projects: newProjects });
                        }}
                        readOnly={readOnly}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <EditableElement
                  multiline
                  value={project.rawDescription || ''}
                  onSave={(val) => {
                    const newProjects = [...data.projects];
                    newProjects[projIdx] = {
                      ...newProjects[projIdx],
                      rawDescription: val,
                    };
                    onUpdate({ ...data, projects: newProjects });
                  }}
                  placeholder="No description provided. Click to add one."
                  style={{ ...bodyTextStyle, fontStyle: 'italic' }}
                  readOnly={readOnly}
                />
              )}
            </div>
          ))}
        </section>
      )}

      {isVisible('education') && data.education.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Education</h3>
          {data.education.map((edu) => (
            <div key={edu.id} style={itemBlockStyle}>
              <div style={itemTitleRowStyle}>
                <h4 style={itemTitleStyle}>{edu.school}</h4>
                <span style={itemMetaStyle}>
                  {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                </span>
              </div>
              <div style={bodyTextStyle}>
                {edu.degree}
                {edu.field ? ` in ${edu.field}` : ''}
                {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
              </div>
            </div>
          ))}
        </section>
      )}

      {isVisible('certifications') &&
        data.certifications &&
        data.certifications.length > 0 && (
          <section style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>Certifications</h3>
            {data.certifications.map((cert) => (
              <div key={cert.id} style={itemBlockStyle}>
                <div style={itemTitleRowStyle}>
                  <h4 style={itemTitleStyle}>{cert.name}</h4>
                  <span style={itemMetaStyle}>{cert.date}</span>
                </div>
                <div style={italicLineStyle}>{cert.issuer}</div>
              </div>
            ))}
          </section>
        )}

      {isVisible('extracurriculars') &&
        data.extracurriculars &&
        data.extracurriculars.length > 0 && (
          <section style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>Extracurricular Activities</h3>
            {data.extracurriculars.map((activity) => (
              <div key={activity.id} style={itemBlockStyle}>
                <div style={itemTitleRowStyle}>
                  <h4 style={itemTitleStyle}>{activity.title}</h4>
                  <span style={itemMetaStyle}>
                    {activity.startDate} – {activity.endDate}
                  </span>
                </div>
                <div style={italicLineStyle}>{activity.organization}</div>
                {activity.refinedBullets && activity.refinedBullets.length > 0 ? (
                  <ul style={bulletListStyle}>
                    {activity.refinedBullets.map((bullet, i) => (
                      <li key={i} style={bulletItemStyle}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={bodyTextStyle}>
                    {activity.description || 'No description provided.'}
                  </p>
                )}
              </div>
            ))}
          </section>
        )}

      {isVisible('awards') && data.awards && data.awards.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Awards & Honors</h3>
          {data.awards.map((award) => (
            <div key={award.id} style={itemBlockStyle}>
              <div style={itemTitleRowStyle}>
                <h4 style={itemTitleStyle}>{award.title}</h4>
                <span style={itemMetaStyle}>{award.date}</span>
              </div>
              <div style={bodyTextStyle}>
                {award.issuer}
                {award.description ? ` – ${award.description}` : ''}
              </div>
            </div>
          ))}
        </section>
      )}

      {isVisible('publications') &&
        data.publications &&
        data.publications.length > 0 && (
          <section style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>Publications</h3>
            {data.publications.map((pub) => (
              <div key={pub.id} style={bodyTextStyle}>
                {pub.title}
                {pub.publisher ? `, ${pub.publisher}` : ''}, {pub.date}
                {pub.link ? ` [${pub.link}]` : ''}
              </div>
            ))}
          </section>
        )}

      {isVisible('affiliations') &&
        data.affiliations &&
        data.affiliations.length > 0 && (
          <section style={sectionStyle}>
            <h3 style={sectionHeadingStyle}>Affiliations</h3>
            {data.affiliations.map((aff) => (
              <div key={aff.id} style={bodyTextStyle}>
                {aff.role}, {aff.organization} ({aff.startDate} – {aff.endDate})
              </div>
            ))}
          </section>
        )}

      {isVisible('skills') && data.skills.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Skills</h3>
          <div style={bodyTextStyle}>{data.skills.join(', ')}</div>
        </section>
      )}
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // COVER LETTER (matches PDF cover letter rendering)
  // ────────────────────────────────────────────────────────────

  const coverLetterFont = template.cssFont;
  const coverLetterContent = data.coverLetter && (
    <div
      id="cover-letter-source"
      style={{
        ...sheetStyle,
        fontFamily: coverLetterFont,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: `${template.sectionGapBefore}pt` }}>
        <div style={{ fontWeight: 700, fontSize: `${template.sizeItemTitle}pt` }}>
          {data.personalInfo.fullName}
        </div>
        <div style={{ fontSize: `${template.sizeBody}pt`, marginTop: '2pt' }}>
          {data.personalInfo.email && <div>{data.personalInfo.email}</div>}
          {data.personalInfo.phone && <div>{data.personalInfo.phone}</div>}
          {data.personalInfo.location && <div>{data.personalInfo.location}</div>}
          {data.personalInfo.linkedin && <div>{data.personalInfo.linkedin}</div>}
        </div>
      </div>

      <div
        style={{
          marginBottom: `${template.sectionGapBefore}pt`,
          fontSize: `${template.sizeBody}pt`,
        }}
      >
        {new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      <div
        style={{
          marginBottom: `${template.sectionGapBefore}pt`,
          fontSize: `${template.sizeBody}pt`,
        }}
      >
        <div>Hiring Manager</div>
        {data.targetJob.company && <div>{data.targetJob.company}</div>}
      </div>

      <div
        style={{
          marginBottom: `${template.itemGap}pt`,
          fontSize: `${template.sizeBody}pt`,
        }}
      >
        Dear Hiring Manager,
      </div>

      <div style={{ flex: 1 }}>
        {data.coverLetter
          .split(/\n\s*\n/)
          .filter((p) => p.trim().length > 0)
          .map((paragraph, idx) => (
            <p
              key={idx}
              style={{
                fontSize: `${template.sizeBody}pt`,
                lineHeight: template.lineHeight,
                margin: `0 0 ${template.itemGap}pt 0`,
                textAlign: 'justify',
              }}
            >
              {paragraph.trim()}
            </p>
          ))}
      </div>

      <div style={{ marginTop: `${template.sectionGapBefore}pt` }}>
        <div
          style={{
            fontSize: `${template.sizeBody}pt`,
            marginBottom: `${template.sectionGapBefore * 2}pt`,
          }}
        >
          Sincerely,
        </div>
        <div style={{ fontWeight: 700, fontSize: `${template.sizeBody}pt` }}>
          {data.personalInfo.fullName}
        </div>
      </div>
    </div>
  );

  // ────────────────────────────────────────────────────────────
  // SHELL
  // ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-charcoal-50 overflow-hidden">
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
            {data.targetJob?.title
              ? `${data.targetJob.title} Resume - `
              : 'Resume - '}
            {new Date().getFullYear()}
          </h1>
        </div>

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end flex-wrap overflow-x-auto scrollbar-hide">
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md border shadow-sm transition-colors disabled:opacity-50 bg-white border-brand-200 text-brand-700 hover:bg-brand-50"
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

          {(activeTab === 'resume' || activeTab === 'coverLetter') && (
            <>
              <button
                type="button"
                onClick={
                  activeTab === 'resume' ? handleWordExport : handleCoverLetterExport
                }
                disabled={
                  isExporting || (activeTab !== 'resume' && !onExportCoverLetter)
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-700 bg-charcoal-50 border border-charcoal-300 rounded-md hover:border-brand-700 shadow-sm transition-colors disabled:opacity-50"
              >
                <FileText size={16} />
                Download Word
              </button>

              <button
                type="button"
                onClick={handlePDFExport}
                disabled={isPdfGenerating}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-charcoal-50 bg-brand-700 rounded-md hover:bg-brand-800 shadow-sm transition-colors disabled:opacity-50"
              >
                {isPdfGenerating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {isPdfGenerating ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Sidebar — template picker + toolkit navigation */}
        <aside className="w-full md:w-[280px] bg-white border-b md:border-b-0 md:border-r border-charcoal-200 overflow-x-auto md:overflow-y-auto flex-shrink-0 scrollbar-hide">
          <div className="p-4 md:p-6 flex flex-row md:flex-col gap-6">
            {/* Documents group — Resume (template picker) + Cover Letter */}
            <div>
              <h2 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.18em] mb-3">
                Documents
              </h2>

              <div className="flex flex-row md:flex-col gap-2 min-w-max md:min-w-0">
                {Object.values(templateRegistry).map((t) => {
                  const isActive =
                    template.id === t.id && activeTab === 'resume';
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => {
                        setActiveTab('resume');
                        onUpdate({ ...data, template: t.id });
                      }}
                      className={`relative flex flex-col text-left px-4 py-3 rounded-md transition-colors ${
                        isActive
                          ? 'bg-accent-50 text-brand-700 border border-accent-200'
                          : 'text-brand-600 border border-transparent hover:bg-charcoal-100'
                      }`}
                    >
                      <span
                        className={`text-sm font-semibold ${isActive ? 'text-brand-700' : ''}`}
                      >
                        {t.displayName}
                      </span>
                      <span className="hidden md:block text-[11px] text-brand-500 leading-snug mt-1">
                        {t.description}
                      </span>
                    </button>
                  );
                })}

                {data.coverLetter && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('coverLetter')}
                    className={`relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${
                      activeTab === 'coverLetter'
                        ? 'bg-accent-50 text-brand-700 border border-accent-200'
                        : 'text-brand-600 border border-transparent hover:bg-charcoal-100'
                    }`}
                  >
                    <FileCheck
                      size={18}
                      className={
                        activeTab === 'coverLetter'
                          ? 'text-accent-600'
                          : 'text-brand-400'
                      }
                    />
                    <span className="text-sm font-semibold">Cover Letter</span>
                  </button>
                )}
              </div>
            </div>

            {/* Outreach group */}
            {(data.toolkit?.outreachEmail || data.toolkit?.linkedInMessage) && (
              <div>
                <h2 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.18em] mb-3">
                  Outreach
                </h2>
                <div className="flex flex-row md:flex-col gap-2 min-w-max md:min-w-0">
                  {data.toolkit.outreachEmail && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('outreachEmail')}
                      className={`relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${
                        activeTab === 'outreachEmail'
                          ? 'bg-accent-50 text-brand-700 border border-accent-200'
                          : 'text-brand-600 border border-transparent hover:bg-charcoal-100'
                      }`}
                    >
                      <Mail
                        size={18}
                        className={
                          activeTab === 'outreachEmail'
                            ? 'text-accent-600'
                            : 'text-brand-400'
                        }
                      />
                      <span className="text-sm font-semibold">Outreach Email</span>
                    </button>
                  )}
                  {data.toolkit.linkedInMessage && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('linkedInMessage')}
                      className={`relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${
                        activeTab === 'linkedInMessage'
                          ? 'bg-accent-50 text-brand-700 border border-accent-200'
                          : 'text-brand-600 border border-transparent hover:bg-charcoal-100'
                      }`}
                    >
                      <Linkedin
                        size={18}
                        className={
                          activeTab === 'linkedInMessage'
                            ? 'text-accent-600'
                            : 'text-brand-400'
                        }
                      />
                      <span className="text-sm font-semibold">LinkedIn Note</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Interview prep */}
            {data.toolkit?.interviewQuestions && data.toolkit.interviewQuestions.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-brand-500 uppercase tracking-[0.18em] mb-3">
                  Interview
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('interviewPrep')}
                  className={`w-full relative flex items-center gap-3 text-left px-4 py-3 rounded-md transition-colors ${
                    activeTab === 'interviewPrep'
                      ? 'bg-accent-50 text-brand-700 border border-accent-200'
                      : 'text-brand-600 border border-transparent hover:bg-charcoal-100'
                  }`}
                >
                  <MessageSquare
                    size={18}
                    className={
                      activeTab === 'interviewPrep'
                        ? 'text-accent-600'
                        : 'text-brand-400'
                    }
                  />
                  <span className="text-sm font-semibold">
                    Question Prep
                    <span className="ml-1.5 text-[11px] font-normal text-brand-500">
                      · {data.toolkit.interviewQuestions.length}
                    </span>
                  </span>
                </button>
              </div>
            )}

            <p className="hidden md:block text-[11px] text-brand-500 leading-snug mt-auto pt-4 border-t border-charcoal-200">
              All resume templates are single-column, real-text, and pass ATS keyword extraction.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-charcoal-50 overflow-auto relative">
          {activeTab === 'resume' && (
            <div className="p-4 md:py-12 flex justify-center min-w-max md:min-w-0">
              {resumeContent}
            </div>
          )}
          {activeTab === 'coverLetter' && (
            <div className="p-4 md:py-12 flex justify-center min-w-max md:min-w-0">
              {coverLetterContent}
            </div>
          )}
          {activeTab === 'outreachEmail' && data.toolkit?.outreachEmail && (
            <OutreachEmailViewer email={data.toolkit.outreachEmail} />
          )}
          {activeTab === 'linkedInMessage' && data.toolkit?.linkedInMessage && (
            <LinkedInMessageViewer message={data.toolkit.linkedInMessage} />
          )}
          {activeTab === 'interviewPrep' && data.toolkit?.interviewQuestions && (
            <InterviewPrepViewer questions={data.toolkit.interviewQuestions} />
          )}
        </main>
      </div>
    </div>
  );
};

// Infrastructure - Word Export Implementation

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TabStopPosition,
  TabStopType,
  BorderStyle,
} from 'docx';
import FileSaver from 'file-saver';
import { ResumeData } from '../../domain/entities/Resume';
import { IResumeExporter } from '../../domain/usecases/ExportResumeUseCase';
import { templateRegistry } from '../../presentation/templates/TemplateRegistry';

export class WordResumeExporter implements IResumeExporter {
  async exportToWord(data: ResumeData): Promise<void> {
    try {
      const doc = this.createDocument(data);
      const blob = await Packer.toBlob(doc);
      const fileName = `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Resume.docx`;
      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      console.error('Word export failed:', error);
      throw new Error(
        `Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async exportCoverLetterToWord(data: ResumeData): Promise<void> {
    if (!data.coverLetter) {
      throw new Error('Cover letter not available');
    }

    try {
      const doc = this.createCoverLetterDocument(data);
      const blob = await Packer.toBlob(doc);
      const fileName = `${data.personalInfo.fullName.replace(/\s+/g, '_')}_Cover_Letter.docx`;
      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      console.error('Cover letter export failed:', error);
      throw new Error(
        `Failed to generate cover letter document: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getTemplateConfig(data: ResumeData) {
    const templateId = data.template || 'classic';
    const template = templateRegistry[templateId] || templateRegistry['classic'];
    const isStrict = data.isATSStrict || false;

    let fontFamily = 'Arial';
    if (template.typography.fontFamily === 'font-serif') fontFamily = 'Georgia';
    else if (template.typography.fontFamily === 'font-mono') fontFamily = 'Courier New';

    const colorMap: Record<string, string> = {
      'text-brand-900': '312E81',
      'text-charcoal-900': '111827',
      'text-charcoal-800': '1F2937',
      'text-blue-800': '1E40AF',
      'text-slate-900': '0F172A',
    };

    const primaryColor = isStrict ? '000000' : (colorMap[template.colors.primary] || '111827');
    const textColor = isStrict ? '000000' : (colorMap[template.colors.text] || '1F2937');
    const headerAlignment = template.layout.headerAlignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT;
    const sectionDivider = isStrict ? false : template.layout.sectionDivider === 'line';
    const nameAllCaps = template.layout.nameStyle === 'uppercase';

    let nameSize = 32;
    let headingSize = 14;
    if (template.id === 'executive') nameSize = 36;
    else if (template.id === 'modern') nameSize = 36;
    else if (template.id === 'minimal') headingSize = 12;

    let itemSpacing = 120;
    let sectionGap = 240;
    if (template.id === 'compact') {
      itemSpacing = 60;
      sectionGap = 120;
    } else if (template.id === 'executive' || template.id === 'minimal') {
      itemSpacing = 180;
      sectionGap = 360;
    }

    return {
      fontFamily,
      primaryColor,
      textColor,
      headerAlignment,
      sectionDivider,
      nameAllCaps,
      nameSize: nameSize * 2,
      headingSize: headingSize * 2,
      itemSpacing,
      sectionGap
    };
  }

  private createDocument(data: ResumeData): Document {
    const config = this.getTemplateConfig(data);
    const headerLines = this.createHeader(data, config);
    const sections = this.createSections(data, config);

    return new Document({
      styles: {
        default: {
          document: {
            run: {
              font: config.fontFamily,
              color: config.textColor,
              size: 20, // 10pt
            },
          },
        },
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              size: config.nameSize,
              bold: true,
              color: config.primaryColor,
              font: config.fontFamily,
              allCaps: config.nameAllCaps,
            },
            paragraph: {
              alignment: config.headerAlignment,
              spacing: { after: 120 },
            },
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: {
              size: config.headingSize,
              bold: true,
              color: config.primaryColor,
              font: config.fontFamily,
              allCaps: true,
            },
            paragraph: {
              alignment: config.headerAlignment,
              spacing: { before: config.sectionGap, after: 100 },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children: [...headerLines, ...sections],
        },
      ],
    });
  }

  private createHeader(data: ResumeData, config: ReturnType<typeof this.getTemplateConfig>): Paragraph[] {
    const headerLines = [
      new Paragraph({
        text: data.personalInfo.fullName,
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    const contactParts = [
      data.personalInfo.email,
      data.personalInfo.phone,
      data.personalInfo.location,
      data.personalInfo.linkedin,
      data.personalInfo.github,
      data.personalInfo.website,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      headerLines.push(
        new Paragraph({
          children: [new TextRun({ text: contactParts.join(' | '), size: 20 })],
          alignment: config.headerAlignment,
          spacing: { after: 240 },
        })
      );
    }

    return headerLines;
  }

  private createSections(data: ResumeData, config: ReturnType<typeof this.getTemplateConfig>): Paragraph[] {
    const sections: Paragraph[] = [];

    if (data.summary) {
      sections.push(this.createSectionHeading('Professional Summary', config));
      sections.push(new Paragraph({ children: [new TextRun(data.summary)], spacing: { after: config.itemSpacing } }));
    }

    if (data.experience && data.experience.length > 0) {
      sections.push(this.createSectionHeading('Experience', config));
      for (const exp of data.experience) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.role, bold: true, size: 22 }),
              new TextRun({ text: `\t${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate}`, bold: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: config.itemSpacing },
          })
        );
        sections.push(new Paragraph({ children: [new TextRun({ text: exp.company, italics: true })], spacing: { after: 60 } }));

        if (exp.refinedBullets && exp.refinedBullets.length > 0) {
          exp.refinedBullets.forEach(bullet => sections.push(this.createBullet(bullet, config.itemSpacing)));
        } else {
          sections.push(this.createBullet(exp.rawDescription, config.itemSpacing));
        }
      }
    }

    if (data.projects && data.projects.length > 0) {
      sections.push(this.createSectionHeading('Projects', config));
      for (const proj of data.projects) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: proj.name, bold: true, size: 22 }),
              new TextRun({ text: proj.technologies ? ` | ${proj.technologies}` : '', italics: true }),
            ],
            spacing: { before: config.itemSpacing }
          })
        );
        if (proj.link) sections.push(new Paragraph({ children: [new TextRun({ text: proj.link, color: '0563C1' })] }));
        if (proj.refinedBullets && proj.refinedBullets.length > 0) {
          proj.refinedBullets.forEach(b => sections.push(this.createBullet(b, config.itemSpacing)));
        } else {
          sections.push(this.createBullet(proj.rawDescription, config.itemSpacing));
        }
      }
    }

    if (data.education && data.education.length > 0) {
      sections.push(this.createSectionHeading('Education', config));
      for (const edu of data.education) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.school, bold: true, size: 22 }),
              new TextRun({ text: `\t${edu.startDate} – ${edu.endDate}`, bold: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: config.itemSpacing },
          })
        );
        const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`;
        sections.push(new Paragraph({ text: degreeText, spacing: { after: 60 } }));
      }
    }

    if (data.certifications && data.certifications.length > 0) {
      sections.push(this.createSectionHeading('Certifications', config));
      for (const cert of data.certifications) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: cert.name, bold: true, size: 22 }),
              new TextRun({ text: `\t${cert.date}`, bold: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: config.itemSpacing }
          })
        );
        sections.push(new Paragraph({ children: [new TextRun({ text: cert.issuer, italics: true })], spacing: { after: 60 } }));
      }
    }

    if (data.extracurriculars && data.extracurriculars.length > 0) {
      sections.push(this.createSectionHeading('Extracurricular Activities', config));
      for (const extra of data.extracurriculars) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: extra.title, bold: true, size: 22 }),
              new TextRun({ text: `\t${extra.startDate} – ${extra.endDate}`, bold: true }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: config.itemSpacing }
          })
        );
        sections.push(new Paragraph({ children: [new TextRun({ text: extra.organization, italics: true })], spacing: { after: 60 } }));
        if (extra.refinedBullets && extra.refinedBullets.length > 0) {
          extra.refinedBullets.forEach(b => sections.push(this.createBullet(b, config.itemSpacing)));
        } else {
          sections.push(this.createBullet(extra.description, config.itemSpacing));
        }
      }
    }

    if (data.awards && data.awards.length > 0) {
      sections.push(this.createSectionHeading('Awards & Honors', config));
      for (const award of data.awards) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: award.title, bold: true }),
              new TextRun({ text: `\t${award.date}` }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: config.itemSpacing }
          })
        );
        sections.push(new Paragraph({ text: `${award.issuer}${award.description ? ` - ${award.description}` : ''}`, spacing: { after: 60 } }));
      }
    }

    if (data.publications && data.publications.length > 0) {
      sections.push(this.createSectionHeading('Publications', config));
      for (const pub of data.publications) {
        sections.push(
          new Paragraph({
            text: `${pub.title}, ${pub.publisher}, ${pub.date}${pub.link ? ` [${pub.link}]` : ''}`,
            spacing: { before: config.itemSpacing }
          })
        );
      }
    }

    if (data.affiliations && data.affiliations.length > 0) {
      sections.push(this.createSectionHeading('Affiliations', config));
      for (const aff of data.affiliations) {
        sections.push(
          new Paragraph({
            text: `${aff.role}, ${aff.organization} (${aff.startDate} – ${aff.endDate})`,
            spacing: { before: config.itemSpacing }
          })
        );
      }
    }

    if (data.skills && data.skills.length > 0) {
      sections.push(this.createSectionHeading('Skills', config));
      sections.push(
        new Paragraph({
          children: [new TextRun(data.skills.join(' • '))],
          spacing: { after: config.itemSpacing },
        })
      );
    }

    return sections;
  }

  private createSectionHeading(text: string, config: ReturnType<typeof this.getTemplateConfig>): Paragraph {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      border: config.sectionDivider ? {
        bottom: { color: config.primaryColor, space: 1, style: BorderStyle.SINGLE, size: 6 },
      } : undefined,
    });
  }

  private createBullet(text: string, itemSpacing: number): Paragraph {
    return new Paragraph({
      text: text,
      bullet: { level: 0 },
      spacing: { before: 40, after: 40 },
    });
  }

  private createCoverLetterDocument(data: ResumeData): Document {
    const paragraphs: Paragraph[] = [];
    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Date
    paragraphs.push(
      new Paragraph({
        text: today,
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
      })
    );

    // Recipient (if company name available)
    if (data.targetJob.company) {
      paragraphs.push(
        new Paragraph({
          text: data.targetJob.company,
          spacing: { after: 60 },
        })
      );
    }
    paragraphs.push(
      new Paragraph({
        text: 'Hiring Manager',
        spacing: { after: 240 },
      })
    );

    // Salutation
    paragraphs.push(
      new Paragraph({
        text: 'Dear Hiring Manager,',
        spacing: { after: 240 },
      })
    );

    // Cover letter body - split by paragraphs
    const coverLetterText = data.coverLetter || '';
    const bodyParagraphs = coverLetterText
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0)
      .map(p => p.trim());

    bodyParagraphs.forEach((para, index) => {
      // Skip if it's a greeting or closing
      if (
        para.toLowerCase().includes('dear') ||
        para.toLowerCase().includes('sincerely') ||
        para.toLowerCase().includes('best regards') ||
        para.toLowerCase().includes('respectfully')
      ) {
        return;
      }

      paragraphs.push(
        new Paragraph({
          children: [new TextRun(para)],
          spacing: { after: index < bodyParagraphs.length - 1 ? 180 : 240 },
        })
      );
    });

    // Closing
    paragraphs.push(
      new Paragraph({
        text: 'Sincerely,',
        spacing: { before: 240, after: 480 },
      })
    );

    // Signature line
    paragraphs.push(
      new Paragraph({
        text: data.personalInfo.fullName,
        spacing: { after: 60 },
      })
    );

    if (data.personalInfo.email) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: data.personalInfo.email, size: 20 })],
        })
      );
    }

    if (data.personalInfo.phone) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: data.personalInfo.phone, size: 20 })],
        })
      );
    }

    return new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: paragraphs,
        },
      ],
    });
  }
}


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

  private createDocument(data: ResumeData): Document {
    const headerLines = this.createHeader(data);
    const sections = this.createSections(data);

    return new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 720, // 0.5 inch (Twips)
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: [...headerLines, ...sections],
        },
      ],
    });
  }

  private createHeader(data: ResumeData): Paragraph[] {
    const headerLines = [
      new Paragraph({
        text: data.personalInfo.fullName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
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
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        })
      );
    }

    return headerLines;
  }

  private createSections(data: ResumeData): Paragraph[] {
    const sections: Paragraph[] = [];

    // Summary
    if (data.summary) {
      sections.push(this.createHeading('Professional Summary'));
      sections.push(
        new Paragraph({
          children: [new TextRun(data.summary)],
          spacing: { after: 200 },
        })
      );
    }

    // Experience
    if (data.experience.length > 0) {
      sections.push(this.createHeading('Experience'));
      for (const exp of data.experience) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.role, bold: true, size: 24 }),
              new TextRun({
                text: `\t${exp.startDate} – ${exp.isCurrent ? 'Present' : exp.endDate}`,
                bold: true,
              }),
            ],
            tabStops: [
              { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
            ],
            spacing: { before: 120 },
          })
        );

        sections.push(
          new Paragraph({
            children: [new TextRun({ text: exp.company, italics: true })],
            spacing: { after: 60 },
          })
        );

        if (exp.refinedBullets && exp.refinedBullets.length > 0) {
          exp.refinedBullets.forEach(bullet => {
            sections.push(this.createBullet(bullet));
          });
        } else {
          sections.push(this.createBullet(exp.rawDescription));
        }
      }
    }

    // Education
    if (data.education.length > 0) {
      sections.push(this.createHeading('Education'));
      for (const edu of data.education) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.school, bold: true, size: 24 }),
              new TextRun({
                text: `\t${edu.startDate} – ${edu.endDate}`,
                bold: true,
              }),
            ],
            tabStops: [
              { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
            ],
            spacing: { before: 120 },
          })
        );
        const degreeText = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''}${edu.gpa ? ` • GPA: ${edu.gpa}` : ''}`;
        sections.push(
          new Paragraph({
            text: degreeText,
          })
        );
      }
    }

    // Skills
    if (data.skills.length > 0) {
      sections.push(this.createHeading('Skills'));
      sections.push(
        new Paragraph({
          children: [new TextRun(data.skills.join(' • '))],
          spacing: { after: 120 },
        })
      );
    }

    return sections;
  }

  private createHeading(text: string): Paragraph {
    return new Paragraph({
      text: text.toUpperCase(),
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 200, after: 100 },
      border: {
        bottom: { color: '999999', space: 1, value: BorderStyle.SINGLE, size: 6 },
      },
    });
  }

  private createBullet(text: string): Paragraph {
    return new Paragraph({
      text: text,
      bullet: { level: 0 },
      spacing: { before: 60, after: 60 },
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


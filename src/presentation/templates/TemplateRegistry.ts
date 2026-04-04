import { ResumeTemplate } from '../../domain/entities/Resume';

export interface TemplateDefinition {
    id: ResumeTemplate;
    displayName: string;
    description: string;

    typography: {
        fontFamily: string;
        baseSize: string;
        headingWeight: string;
        lineHeight: string;
    };

    colors: {
        primary: string;
        text: string;
        muted: string;
        divider: string;
    };

    spacing: {
        sectionGap: string;
        itemGap: string;
    };

    layout: {
        headerAlignment: 'left' | 'center';
        sectionDivider: 'line' | 'none';
        nameStyle: 'bold' | 'uppercase' | 'normal';
        skillStyle: 'inline' | 'tags';
    };
}

export const templateRegistry: Record<ResumeTemplate, TemplateDefinition> = {
    classic: {
        id: 'classic',
        displayName: 'Classic',
        description: 'Traditional monochrome layout with serif fonts for a timeless professional look.',
        typography: { fontFamily: 'font-serif', baseSize: 'text-sm', headingWeight: 'font-bold', lineHeight: 'leading-relaxed' },
        colors: { primary: 'text-charcoal-900', text: 'text-charcoal-800', muted: 'text-charcoal-600', divider: 'border-charcoal-900' },
        spacing: { sectionGap: 'mb-6', itemGap: 'space-y-5' },
        layout: { headerAlignment: 'left', sectionDivider: 'none', nameStyle: 'uppercase', skillStyle: 'inline' },
    },
    executive: {
        id: 'executive',
        displayName: 'Executive',
        description: 'Centered headers and increased spacing for senior leadership roles.',
        typography: { fontFamily: 'font-serif', baseSize: 'text-sm', headingWeight: 'font-bold', lineHeight: 'leading-loose' },
        colors: { primary: 'text-charcoal-900', text: 'text-charcoal-800', muted: 'text-charcoal-600', divider: 'border-charcoal-400' },
        spacing: { sectionGap: 'mb-8', itemGap: 'space-y-6' },
        layout: { headerAlignment: 'center', sectionDivider: 'line', nameStyle: 'uppercase', skillStyle: 'inline' },
    },
    minimal: {
        id: 'minimal',
        displayName: 'Minimal',
        description: 'Stripped back design emphasizing whitespace and content over structure.',
        typography: { fontFamily: 'font-sans', baseSize: 'text-sm', headingWeight: 'font-medium', lineHeight: 'leading-loose' },
        colors: { primary: 'text-charcoal-900', text: 'text-charcoal-700', muted: 'text-charcoal-500', divider: 'border-transparent' },
        spacing: { sectionGap: 'mb-8', itemGap: 'space-y-4' },
        layout: { headerAlignment: 'left', sectionDivider: 'none', nameStyle: 'normal', skillStyle: 'inline' },
    },
    compact: {
        id: 'compact',
        displayName: 'Compact',
        description: 'High-density layout perfect for fitting extensive experience onto a single page.',
        typography: { fontFamily: 'font-sans', baseSize: 'text-xs', headingWeight: 'font-bold', lineHeight: 'leading-snug' },
        colors: { primary: 'text-charcoal-900', text: 'text-charcoal-900', muted: 'text-charcoal-700', divider: 'border-charcoal-300' },
        spacing: { sectionGap: 'mb-3', itemGap: 'space-y-2' },
        layout: { headerAlignment: 'left', sectionDivider: 'line', nameStyle: 'bold', skillStyle: 'inline' },
    },
    technical: {
        id: 'technical',
        displayName: 'Technical',
        description: 'Dense and data-driven visually highlighting skills and technologies.',
        typography: { fontFamily: 'font-mono', baseSize: 'text-sm', headingWeight: 'font-bold', lineHeight: 'leading-normal' },
        colors: { primary: 'text-slate-900', text: 'text-slate-800', muted: 'text-slate-600', divider: 'border-slate-800' },
        spacing: { sectionGap: 'mb-5', itemGap: 'space-y-4' },
        layout: { headerAlignment: 'left', sectionDivider: 'line', nameStyle: 'uppercase', skillStyle: 'tags' },
    }
};

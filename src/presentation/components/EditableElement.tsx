import React, { useState, useEffect, useRef } from 'react';

interface EditableProps {
    value: string;
    onSave: (value: string) => void;
    className?: string;
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
    multiline?: boolean;
    placeholder?: string;
    readOnly?: boolean;
}

export const EditableElement: React.FC<EditableProps> = ({
    value,
    onSave,
    className = '',
    as: Tag = 'span',
    multiline = false,
    placeholder,
    readOnly = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (localValue !== value) {
            onSave(localValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !multiline) {
            e.preventDefault();
            handleBlur();
        }
    };

    if (isEditing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className={`w-full bg-transparent outline-none border-b border-indigo-300 ${className} resize-none overflow-hidden`}
                    style={{ height: 'auto', minHeight: '1.5em' }}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                    }}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full bg-transparent outline-none border-b border-indigo-300 ${className}`}
            />
        );
    }

    if (readOnly) {
        return (
            <Tag className={`${className} ${!value && placeholder ? 'text-gray-400 italic' : ''}`}>
                {value || placeholder}
            </Tag>
        );
    }

    return (
        <Tag
            onClick={() => setIsEditing(true)}
            className={`cursor-text hover:bg-gray-50 hover:ring-1 hover:ring-gray-200 rounded px-0.5 -mx-0.5 transition-shadow ${!value && placeholder ? 'text-gray-400 italic' : ''} ${className}`}
            title="Click to edit"
        >
            {value || placeholder}
        </Tag>
    );
};

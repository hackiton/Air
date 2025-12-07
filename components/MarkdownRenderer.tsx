import React from 'react';

// A lightweight custom renderer to avoid heavy dependencies while keeping code clean.
// Handles code blocks, bold, headers, and links.

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple parser logic (for demo purposes, robust apps would use react-markdown)
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let language = '';

    lines.forEach((line, index) => {
      // Code Blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <div key={`code-${index}`} className="my-4 rounded-md overflow-hidden bg-[#1e293b] border border-slate-700">
               {language && <div className="bg-slate-800 px-3 py-1 text-xs text-slate-400 font-mono border-b border-slate-700">{language}</div>}
               <pre className="p-4 overflow-x-auto text-sm font-mono text-emerald-400">
                 {codeBlockContent.join('\n')}
               </pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          language = '';
        } else {
          // Start of code block
          inCodeBlock = true;
          language = line.trim().replace('```', '');
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(<h1 key={index} className="text-2xl font-bold text-white mt-6 mb-3">{line.replace('# ', '')}</h1>);
        return;
      }
      if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-xl font-semibold text-primary-400 mt-5 mb-2">{line.replace('## ', '')}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className="text-lg font-medium text-slate-200 mt-4 mb-2">{line.replace('### ', '')}</h3>);
        return;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const item = line.trim().substring(2);
        elements.push(
          <li key={index} className="ml-4 list-disc text-slate-300 my-1">
             {parseInline(item)}
          </li>
        );
        return;
      }
      
      // Empty lines
      if (line.trim() === '') {
        elements.push(<div key={index} className="h-2"></div>);
        return;
      }

      // Paragraphs
      elements.push(
        <p key={index} className="text-slate-300 leading-relaxed mb-1">
          {parseInline(line)}
        </p>
      );
    });

    return elements;
  };

  const parseInline = (text: string): React.ReactNode[] => {
    // Very basic inline parser for **bold** and `code`
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-400">{part.slice(1, -1)}</code>;
      }
      return part;
    });
  };

  return <div className="markdown-body">{renderContent(content)}</div>;
};

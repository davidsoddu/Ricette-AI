import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {

  const renderInline = (text: string) => {
    // Handle bold text **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  const elements: React.ReactElement[] = [];
  let listType: 'ul' | 'ol' | null = null;
  // FIX: Replaced JSX.Element with React.ReactElement to resolve namespace issue.
  let listItems: React.ReactElement[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ul') {
        elements.push(<ul key={`list-${elements.length}`} className="space-y-1 my-2 pl-5 list-disc">{listItems}</ul>);
      } else if (listType === 'ol') {
        elements.push(<ol key={`list-${elements.length}`} className="space-y-1 my-2 pl-5 list-decimal">{listItems}</ol>);
      }
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, index) => {
    if (line.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-2xl font-bold mt-6 mb-3 text-teal-300">{line.substring(3)}</h2>);
      return;
    }
    if (line.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-3xl font-bold mb-4 text-white">{line.substring(2)}</h1>);
      return;
    }
    
    const isUlItem = line.startsWith('* ');
    const olMatch = line.match(/^(\d+)\.\s(.*)/);

    if (isUlItem) {
      if (listType !== 'ul') {
        flushList();
        listType = 'ul';
      }
      listItems.push(<li key={index}>{renderInline(line.substring(2))}</li>);
    } else if (olMatch) {
      if (listType !== 'ol') {
        flushList();
        listType = 'ol';
      }
      listItems.push(<li key={index}>{renderInline(olMatch[2])}</li>);
    } else {
      flushList();
      if (line.trim() !== '') {
        elements.push(<p key={index} className="my-2 leading-relaxed">{renderInline(line)}</p>);
      }
    }
  });

  flushList();

  return <div className="text-gray-300">{elements}</div>;
};

export default MarkdownRenderer;

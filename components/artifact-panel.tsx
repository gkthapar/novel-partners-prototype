'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Edit, Eye, Download, Send, GripVertical } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Artifact } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface ArtifactPanelProps {
  artifact: Artifact;
  onUpdate: (content: string) => void;
  onClose: () => void;
}

export function ArtifactPanel({ artifact, onUpdate, onClose }: ArtifactPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(artifact.content);
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(400, Math.min(1200, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleSave = () => {
    onUpdate(editContent);
    setIsEditing(false);
  };

  const handleExport = () => {
    const blob = new Blob([artifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.title.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const typeLabels: Record<string, string> = {
    document: 'Document',
    lesson_plan: 'Lesson Plan',
    assessment: 'Assessment',
    handout: 'Student Handout'
  };

  return (
    <div
      ref={panelRef}
      className="flex flex-col border-l bg-background relative"
      style={{ width: `${width}px`, minWidth: '400px', maxWidth: '1200px' }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
        onMouseDown={() => setIsResizing(true)}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Header */}
      <div className="border-b p-4 pl-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {typeLabels[artifact.type]}
            </div>
            <h2 className="text-lg font-semibold">{artifact.title}</h2>
            {artifact.metadata && (
              <div className="mt-2 flex flex-wrap gap-2">
                {artifact.metadata.course && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                    {artifact.metadata.course}
                  </span>
                )}
                {artifact.metadata.unit && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
                    {artifact.metadata.unit}
                  </span>
                )}
                {artifact.metadata.adaptedFor && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs">
                    Adapted for: {artifact.metadata.adaptedFor}
                  </span>
                )}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-3">
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <Eye className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
            {isEditing ? 'Preview' : 'Edit'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-1" />
            To EnlightenAI
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[600px] font-mono text-sm p-4 rounded-lg border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditContent(artifact.content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-6
              prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-5
              prose-h3:text-lg prose-h3:mb-2 prose-h3:mt-4
              prose-p:my-3 prose-p:leading-7
              prose-ul:my-3 prose-li:my-1
              prose-ol:my-3
              prose-strong:font-semibold prose-strong:text-foreground
              prose-code:text-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic
              prose-table:w-full prose-table:border-collapse
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left
              prose-td:border prose-td:border-border prose-td:p-2
            ">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-semibold mb-4 mt-6" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold mb-3 mt-5" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold mb-2 mt-4" {...props} />,
                  p: ({node, ...props}) => <p className="my-3 leading-7" {...props} />,
                  ul: ({node, ...props}) => <ul className="my-3 list-disc list-inside space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="my-3 list-decimal list-inside space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="my-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                  code: ({node, inline, ...props}: any) =>
                    inline ? (
                      <code className="text-sm bg-muted px-1 py-0.5 rounded" {...props} />
                    ) : (
                      <code className="block text-sm bg-muted p-4 rounded-lg overflow-x-auto" {...props} />
                    ),
                  table: ({node, ...props}) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="w-full border-collapse" {...props} />
                    </div>
                  ),
                  th: ({node, ...props}) => <th className="border border-border bg-muted p-2 text-left font-semibold" {...props} />,
                  td: ({node, ...props}) => <td className="border border-border p-2" {...props} />,
                }}
              >
                {artifact.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

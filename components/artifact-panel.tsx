'use client';

import { useState } from 'react';
import { X, Edit, Eye, Download, Send } from 'lucide-react';
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
    <div className="w-[600px] flex flex-col border-l bg-background">
      {/* Header */}
      <div className="border-b p-4">
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
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{artifact.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

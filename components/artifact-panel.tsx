'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Edit, Eye, Download, Send, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Artifact } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelectArtifact: (artifactId: string) => void;
  onUpdateArtifact: (artifactId: string, content: string) => void;
  onClosePanel: () => void;
}

export function ArtifactPanel({
  artifacts,
  activeArtifactId,
  onSelectArtifact,
  onUpdateArtifact,
  onClosePanel
}: ArtifactPanelProps) {
  const activeArtifact = useMemo(() => {
    if (artifacts.length === 0) return undefined;
    if (!activeArtifactId) return artifacts[artifacts.length - 1];
    return artifacts.find(artifact => artifact.id === activeArtifactId) ?? artifacts[artifacts.length - 1];
  }, [artifacts, activeArtifactId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(activeArtifact?.content ?? '');

  useEffect(() => {
    setIsEditing(false);
    setEditContent(activeArtifact?.content ?? '');
  }, [activeArtifact?.id, activeArtifact?.content]);

  const handleSave = () => {
    if (!activeArtifact) return;
    onUpdateArtifact(activeArtifact.id, editContent);
    setIsEditing(false);
  };

  const handleExport = () => {
    if (!activeArtifact) return;

    const blob = new Blob([activeArtifact.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeArtifact.title.replace(/\s+/g, '-')}.md`;
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

  if (!activeArtifact) {
    return null;
  }

  return (
    <div className="w-[600px] flex flex-col border-l bg-background">
      {/* Tabs */}
      <div className="border-b px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-2">
            {artifacts.map(artifact => (
              <button
                key={artifact.id}
                onClick={() => onSelectArtifact(artifact.id)}
                className={`whitespace-nowrap rounded-t-md border px-3 py-1 text-sm transition-colors ${
                  artifact.id === activeArtifact.id
                    ? 'bg-background border-border border-b-transparent text-primary'
                    : 'bg-muted text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                {artifact.title}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={onClosePanel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {typeLabels[activeArtifact.type] ?? 'Artifact'}
            </div>
            <h2 className="text-lg font-semibold">{activeArtifact.title}</h2>
            {activeArtifact.metadata && (
              <div className="mt-2 flex flex-wrap gap-2">
                {activeArtifact.metadata.course && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                    {activeArtifact.metadata.course}
                  </span>
                )}
                {activeArtifact.metadata.unit && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs">
                    {activeArtifact.metadata.unit}
                  </span>
                )}
                {activeArtifact.metadata.adaptedFor && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-accent text-accent-foreground text-xs">
                    Adapted for: {activeArtifact.metadata.adaptedFor}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {!activeArtifact.embedUrl && (
            <Button
              variant={isEditing ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <Eye className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
              {isEditing ? 'Preview' : 'Edit'}
            </Button>
          )}
          {!activeArtifact.embedUrl && activeArtifact.content && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}
          {activeArtifact.externalUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(activeArtifact.externalUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open in Google Docs
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Send className="w-4 h-4 mr-1" />
            To EnlightenAI
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {activeArtifact.embedUrl ? (
            <div className="aspect-[8.5/11] w-full overflow-hidden rounded-lg border bg-muted">
              <iframe
                src={activeArtifact.embedUrl}
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={activeArtifact.title}
              />
            </div>
          ) : isEditing ? (
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
                    setEditContent(activeArtifact.content);
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{activeArtifact.content}</ReactMarkdown>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Message, Artifact } from '@/lib/types';
import { courses, units, lessons } from '@/lib/curriculum-data';
import ReactMarkdown from 'react-markdown';
import { ArtifactPanel } from './artifact-panel';
import type { Components } from 'react-markdown';
import { cn } from '@/lib/utils';

const markdownComponents: Components = {
  p: ({ node: _node, className, children, ...props }) => (
    <p
      {...props}
      className={cn(
        'whitespace-pre-line break-words text-[15px] leading-6 text-foreground/90 last:mb-0',
        className
      )}
    >
      {children}
    </p>
  ),
  ul: ({ node: _node, className, children, ...props }) => (
    <ul
      {...props}
      className={cn('ml-5 mt-3 list-disc space-y-2 text-[15px] leading-6 text-foreground/90', className)}
    >
      {children}
    </ul>
  ),
  ol: ({ node: _node, className, children, ...props }) => (
    <ol
      {...props}
      className={cn('ml-5 mt-3 list-decimal space-y-2 text-[15px] leading-6 text-foreground/90', className)}
    >
      {children}
    </ol>
  ),
  li: ({ node: _node, className, children, ...props }) => (
    <li {...props} className={cn('pl-1', className)}>
      {children}
    </li>
  ),
  blockquote: ({ node: _node, className, children, ...props }) => (
    <blockquote
      {...props}
      className={cn(
        'my-4 border-l-2 border-primary/60 pl-3 text-[15px] leading-6 text-foreground/80',
        className
      )}
    >
      {children}
    </blockquote>
  ),
  pre: ({ node: _node, className, children, ...props }) => (
    <pre
      {...props}
      className={cn(
        'my-3 overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs text-foreground shadow-sm',
        className
      )}
    >
      {children}
    </pre>
  ),
  code: ({ node: _node, inline, className, children, ...props }) => {
    if (inline) {
      return (
        <code
          {...props}
          className={cn(
            'rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground shadow-sm',
            className
          )}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        {...props}
        className={cn(
          'block whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-xs text-foreground shadow-sm',
          className
        )}
      >
        {children}
      </code>
    );
  }
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifactList, setArtifactList] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          currentArtifact: artifactList.find(a => a.id === activeArtifactId) ?? null
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        toolCalls: data.toolCalls,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update artifact if one was created/updated
      const artifactsFromResponse = (Array.isArray(data.artifactList) ? data.artifactList : []).filter(
        (artifact: Artifact | null): artifact is Artifact => Boolean(artifact)
      );

      if (artifactsFromResponse.length > 0) {
        setArtifactList(prev => {
          const existingMap = new Map(prev.map(artifact => [artifact.id, artifact] as const));
          for (const artifact of artifactsFromResponse) {
            if (!artifact?.id) continue;
            const previous = existingMap.get(artifact.id);
            existingMap.set(artifact.id, previous ? { ...previous, ...artifact } : artifact);
          }
          return Array.from(existingMap.values());
        });

        const latestArtifact = artifactsFromResponse[artifactsFromResponse.length - 1];
        if (latestArtifact?.id) {
          setActiveArtifactId(latestArtifact.id);
        }
      }

    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `I'm sorry, I encountered an error: ${error.message}. Please make sure your ANTHROPIC_API_KEY is set in the .env.local file.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const availableUnits = selectedCourse
    ? units.filter(u => u.courseId === selectedCourse)
    : units;

  const availableLessons = selectedUnit
    ? lessons.filter(l => l.unitId === selectedUnit)
    : lessons;

  const quickPrompts = [
    "Show me the teacher guide for Unit 1 Lesson 1",
    "Create an ELL-adapted version of the character analysis chart for Lexile 700-800",
    "Make a 2-paragraph exit ticket on theme and belonging aligned to the rubric",
    "List all performance tasks in this unit",
    "Help me plan a 20-minute mini-lesson on cultural identity using the Binti curriculum"
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col border-r">
        {/* Header with Context Selectors */}
        <div className="border-b p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-lg">Novel Partners Curriculum Assistant</h1>
          </div>

          <div className="flex gap-2">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUnit} onValueChange={setSelectedUnit} disabled={!selectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Unit" />
              </SelectTrigger>
              <SelectContent>
                {availableUnits.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    Unit {u.number}: {u.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLesson} onValueChange={setSelectedLesson} disabled={!selectedUnit}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Lesson" />
              </SelectTrigger>
              <SelectContent>
                {availableLessons.map(l => (
                  <SelectItem key={l.id} value={l.id}>
                    Lesson {l.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-4 py-6">
            {messages.length === 0 && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <BookOpen className="mb-4 h-16 w-16 text-muted-foreground" />
                <h2 className="mb-2 text-2xl font-semibold">Welcome to Novel Partners Assistant</h2>
                <p className="mb-6 max-w-md text-muted-foreground">
                  Ask me anything about your Novel Partners curriculum, or try one of these prompts:
                </p>
                <div className="w-full space-y-2">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="block w-full rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(message => {
              const isUser = message.role === 'user';

              return (
                <div key={message.id} className="mb-6">
                  <div
                    className={cn(
                      'flex items-start gap-3',
                      isUser ? 'justify-end' : ''
                    )}
                  >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      NP
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3 shadow-sm transition-colors',
                      'max-w-full sm:max-w-[520px] lg:max-w-[600px] text-[15px] leading-6',
                      isUser
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted text-foreground'
                    )}
                  >
                    <ReactMarkdown className="space-y-4" components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>

                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1 text-muted-foreground">
                        {message.toolCalls.map((tc, idx) => (
                          <div key={idx}>
                            🔧 Used tool: <span className="font-mono">{tc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                      You
                    </div>
                  )}
                </div>
              </div>
            );
          })}

            {isLoading && (
              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  NP
                </div>
                <div className="max-w-full rounded-2xl bg-muted px-4 py-3 text-foreground shadow-sm sm:max-w-[520px] lg:max-w-[600px]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t">
          <div className="mx-auto w-full max-w-[720px] px-4 py-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about the curriculum, create materials, or adapt content..."
              className="flex-1 resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-h-[60px] max-h-[200px]"
              rows={2}
            />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[52px] w-[52px]"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>

      {/* Artifact Panel */}
      {artifactList.length > 0 && (
        <ArtifactPanel
          artifacts={artifactList}
          activeArtifactId={activeArtifactId}
          onSelectArtifact={setActiveArtifactId}
          onUpdateArtifact={(artifactId, content) => {
            setArtifactList(prev =>
              prev.map(artifact =>
                artifact.id === artifactId ? { ...artifact, content } : artifact
              )
            );
          }}
          onClosePanel={() => {
            setArtifactList([]);
            setActiveArtifactId(null);
          }}
        />
      )}
    </div>
  );
}

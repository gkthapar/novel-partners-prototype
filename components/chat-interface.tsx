'use client';

import { useState, useRef, useEffect, type MouseEventHandler } from 'react';
import { Send, BookOpen, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Message, Artifact } from '@/lib/types';
import { courses, units, lessons } from '@/lib/curriculum-data';
import ReactMarkdown from 'react-markdown';
import { ArtifactPanel } from './artifact-panel';

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [artifactList, setArtifactList] = useState<Artifact[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (overrideInput?: string) => {
    const messageContent = (overrideInput ?? input).trim();

    if (!messageContent || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setSuggestedFollowUps([]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
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
      setSuggestedFollowUps(
        Array.isArray(data.followUpSuggestions)
          ? data.followUpSuggestions.filter((item: unknown): item is string => typeof item === 'string')
          : []
      );

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
      void handleSend();
    }
  };

  const handleSendButtonClick: MouseEventHandler<HTMLButtonElement> = () => {
    void handleSend();
  };

  const handleSuggestionClick = (
    suggestion: string
  ): MouseEventHandler<HTMLButtonElement> => () => {
    void handleSend(suggestion);
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
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Welcome to Novel Partners Assistant</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Ask me anything about your Novel Partners curriculum, or try one of these prompts:
              </p>
              <div className="space-y-2 max-w-2xl">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(prompt)}
                    className="block w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(message => (
            <div
              key={message.id}
              className={`mb-6 ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}
            >
              <div className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                    NP
                  </div>
                )}
                <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div
                    className={`rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>

                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1">
                        {message.toolCalls.map((tc, idx) => (
                          <div key={idx} className="text-muted-foreground">
                            🔧 Used tool: <span className="font-mono">{tc.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                    You
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3 mb-6 mr-12">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                NP
              </div>
              <div className="flex-1">
                <div className="rounded-lg p-4 bg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
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
              onClick={handleSendButtonClick}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
          {suggestedFollowUps.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide mb-2">
                Suggested follow-up questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedFollowUps.map((suggestion, idx) => (
                  <Button
                    key={`${suggestion}-${idx}`}
                    variant="outline"
                    size="sm"
                    className="text-left whitespace-normal h-auto py-2"
                    onClick={handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
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

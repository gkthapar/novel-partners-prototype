'use client';

import { useState, useRef, useEffect, type MouseEventHandler } from 'react';
import { Send, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Message, Artifact } from '@/lib/types';
import { courses, units, lessons } from '@/lib/curriculum-data';
import ReactMarkdown from 'react-markdown';
import { ArtifactPanel } from './artifact-panel';

const humanizeToolName = (name: string) =>
  name
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

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

    const now = Date.now();
    const userMessage: Message = {
      id: `msg-${now}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    const assistantMessageId = `msg-${now}-assistant`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      statusMessages: [],
      toolActivities: [],
      toolCalls: [],
      isStreaming: true,
      timestamp: new Date()
    };

    setMessages([...updatedMessages, assistantMessage]);
    setInput('');
    setIsLoading(true);
    setSuggestedFollowUps([]);

    const currentArtifact = artifactList.find(a => a.id === activeArtifactId) ?? null;

    const mergeArtifactUpdates = (incoming: Artifact[], activeId?: string | null) => {
      if (!Array.isArray(incoming) || incoming.length === 0) return;

      setArtifactList(prev => {
        const existingMap = new Map(prev.map(artifact => [artifact.id, artifact] as const));
        for (const artifact of incoming) {
          if (!artifact?.id) continue;
          const previous = existingMap.get(artifact.id);
          const merged = previous ? { ...previous, ...artifact } : artifact;
          existingMap.set(artifact.id, merged);
        }
        return Array.from(existingMap.values());
      });

      const nextActive = activeId ?? incoming[incoming.length - 1]?.id;
      if (nextActive) {
        setActiveArtifactId(nextActive);
      }
    };

    const updateAssistantMessage = (updater: (message: Message) => Message) => {
      setMessages(prev =>
        prev.map(message => (message.id === assistantMessageId ? updater(message) : message))
      );
    };

    const appendStatusMessage = (status: string) => {
      if (!status) return;
      updateAssistantMessage(message => {
        const existing = message.statusMessages ?? [];
        if (existing[existing.length - 1] === status) {
          return { ...message, isStreaming: true };
        }
        return {
          ...message,
          isStreaming: true,
          statusMessages: [...existing, status]
        };
      });
    };

    const appendToken = (text: string) => {
      if (!text) return;
      updateAssistantMessage(message => ({
        ...message,
        isStreaming: true,
        content: (message.content ?? '') + text
      }));
    };

    const startToolActivity = (event: any) => {
      const description: string = event.description ?? event.label ?? event.toolCall?.name ?? '';
      updateAssistantMessage(message => {
        const activities = message.toolActivities ?? [];
        const filtered = activities.filter(activity => activity.id !== event.toolCall?.id);
        return {
          ...message,
          isStreaming: true,
          toolActivities: [
            ...filtered,
            {
              id: event.toolCall?.id ?? `tool-${Date.now()}`,
              name: event.toolCall?.name ?? 'tool',
              description: description || 'Running helper tool...',
              label: event.label,
              status: 'pending' as const
            }
          ]
        };
      });
    };

    const completeToolActivity = (event: any) => {
      updateAssistantMessage(message => {
        const activities = message.toolActivities ?? [];
        const updatedActivities = activities.map(activity =>
          activity.id === event.toolCall?.id
            ? {
                ...activity,
                description: event.description ?? activity.description,
                label: event.label ?? activity.label,
                status: 'completed' as const,
                resultSummary: event.resultSummary ?? activity.resultSummary
              }
            : activity
        );

        return {
          ...message,
          isStreaming: true,
          toolActivities: updatedActivities
        };
      });
    };

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          })),
          currentArtifact
        })
      });

      if (!response.body) {
        throw new Error('No response body received from the assistant.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;

          let event: any;
          try {
            event = JSON.parse(line);
          } catch (parseError) {
            console.warn('Failed to parse stream chunk', parseError, line);
            continue;
          }

          switch (event.type) {
            case 'status':
              appendStatusMessage(event.message);
              break;
            case 'token':
              appendToken(event.text ?? '');
              break;
            case 'tool_start':
              appendStatusMessage(event.description ?? event.label);
              startToolActivity(event);
              break;
            case 'tool_result':
              appendStatusMessage(event.description ?? event.label);
              completeToolActivity(event);
              break;
            case 'artifact_update': {
              const artifactsFromResponse = Array.isArray(event.artifacts)
                ? event.artifacts.filter((artifact: Artifact | null): artifact is Artifact => Boolean(artifact))
                : [];
              mergeArtifactUpdates(artifactsFromResponse, event.activeArtifactId);
              break;
            }
            case 'complete': {
              updateAssistantMessage(message => ({
                ...message,
                content: event.response ?? message.content,
                isStreaming: false,
                toolCalls: Array.isArray(event.toolCalls) ? event.toolCalls : message.toolCalls,
                toolActivities: (message.toolActivities ?? []).map(activity =>
                  activity.status === 'pending'
                    ? { ...activity, status: 'completed' as const }
                    : activity
                )
              }));

              if (Array.isArray(event.artifactList)) {
                const artifactsFromResponse = event.artifactList.filter(
                  (artifact: Artifact | null): artifact is Artifact => Boolean(artifact)
                );

                if (event.artifactList.length === 0) {
                  setArtifactList([]);
                  setActiveArtifactId(null);
                } else {
                  mergeArtifactUpdates(artifactsFromResponse, event.artifact?.id ?? null);
                }
              }

              setSuggestedFollowUps(
                Array.isArray(event.followUpSuggestions)
                  ? event.followUpSuggestions.filter(
                      (item: unknown): item is string => typeof item === 'string'
                    )
                  : []
              );

              setIsLoading(false);
              break;
            }
            case 'error':
              updateAssistantMessage(message => ({
                ...message,
                content:
                  message.content ||
                  `I'm sorry, I ran into an error: ${
                    event.message ?? 'Please verify your ANTHROPIC_API_KEY is set in .env.local.'
                  }`,
                isStreaming: false
              }));
              appendStatusMessage('The assistant hit an error while working on that request.');
              setIsLoading(false);
              break;
            default:
              break;
          }
        }
      }

      if (buffer.trim().length > 0) {
        try {
          const event = JSON.parse(buffer.trim());
          if (event.type === 'status') {
            appendStatusMessage(event.message);
          }
        } catch (parseError) {
          console.warn('Failed to parse trailing buffer from stream', parseError, buffer);
        }
      }
    } catch (error: any) {
      console.error('Error:', error);
      updateAssistantMessage(message => ({
        ...message,
        content: `I'm sorry, I encountered an error: ${error.message}. Please make sure your ANTHROPIC_API_KEY is set in the .env.local file.`,
        isStreaming: false
      }));
      appendStatusMessage('The assistant hit an error while working on that request.');
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
                    {message.statusMessages && message.statusMessages.length > 0 && (
                      <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                        {message.statusMessages.map((status, idx) => (
                          <div
                            key={`${message.id}-status-${idx}`}
                            className="flex items-center gap-2"
                          >
                            {message.isStreaming && idx === message.statusMessages.length - 1 ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
                            )}
                            <span>{status}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.toolActivities && message.toolActivities.length > 0 && (
                      <div className="mb-3 space-y-2 text-xs">
                        {message.toolActivities.map(activity => (
                          <div
                            key={`${message.id}-${activity.id}`}
                            className="flex items-start gap-2 rounded-md border border-border/50 bg-background/70 px-3 py-2"
                          >
                            {activity.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                            ) : activity.status === 'error' ? (
                              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
                            ) : (
                              <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-primary" />
                            )}
                            <div className="flex-1 space-y-1">
                              {activity.label && (
                                <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                                  {activity.label}
                                </div>
                              )}
                              <div className="text-foreground">{activity.description}</div>
                              {activity.resultSummary && (
                                <div className="text-muted-foreground">{activity.resultSummary}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.content && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}

                    {message.toolCalls && message.toolCalls.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 text-xs space-y-1">
                        {message.toolCalls.map((tc, idx) => (
                          <div key={idx} className="space-y-0.5 text-muted-foreground">
                            <div>🔧 {tc.displayName ?? humanizeToolName(tc.name)}</div>
                            {tc.friendlyDescription && (
                              <div className="text-muted-foreground/80">{tc.friendlyDescription}</div>
                            )}
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

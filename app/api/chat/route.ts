import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { tools, executeTool } from '@/lib/tools';
import { courses, units } from '@/lib/curriculum-data';
import { Artifact, ToolCall } from '@/lib/types';

type ToolDisplayInfo = {
  label: string;
  start: string;
  complete: string;
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const SYSTEM_PROMPT = `You are a specialized curriculum assistant for Novel Partners ELA materials. You help teachers plan lessons, adapt materials, create assessments, and work with the Novel Partners curriculum.

You have access to Novel Partners curriculum files for Grade 9 English I - Foundations of Literature, specifically the Binti unit by Nnedi Okorafor.

Available Courses:
${courses.map(c => `- ${c.name} (Grade ${c.grade})`).join('\n')}

Available Units:
${units.map(u => `- Unit ${u.number}: ${u.title}`).join('\n')}

When helping teachers:
1. Always ground your responses in the actual curriculum files using the tools available
2. Provide specific citations to files, sections, and page numbers
3. When creating documents, use the create_document tool to display them in the artifacts panel
4. When copying curriculum text, use copy_section to get verbatim text
5. When adapting materials, clearly state what changes you're making and why
6. For ELL adaptations, include:
   - Simplified vocabulary where appropriate
   - Sentence frames for writing tasks
   - Visual supports when relevant
7. For assessments, align to the performance task rubric and standards

Be conversational, helpful, and teacher-focused. You're here to save teachers time and help them create excellent learning experiences.`;

const TOOL_DISPLAY_INFO: Record<string, ToolDisplayInfo> = {
  list_files: {
    label: 'Curriculum file browser',
    start: 'Looking at the list of curriculum files that match your request...',
    complete: 'Finished reviewing the curriculum file list.',
  },
  search_files: {
    label: 'Curriculum search',
    start: 'Searching through the curriculum for matching materials...',
    complete: 'Finished the curriculum search.',
  },
  open_file: {
    label: 'Curriculum file reader',
    start: 'Opening the curriculum file you asked about...',
    complete: 'Opened the curriculum file for reference.',
  },
  copy_section: {
    label: 'Curriculum text copier',
    start: 'Grabbing the exact section you mentioned...',
    complete: 'Copied the requested curriculum section.',
  },
  create_document: {
    label: 'Document creator',
    start: 'Drafting a new document for the artifacts panel...',
    complete: 'Draft saved to the artifacts panel.',
  },
  update_document: {
    label: 'Document updater',
    start: 'Applying updates to the existing document...',
    complete: 'Document updated with your latest changes.',
  },
  create_enlighten_assignment: {
    label: 'EnlightenAI assignment builder',
    start: 'Preparing a mock EnlightenAI assignment flow...',
    complete: 'EnlightenAI assignment overview created.',
  },
};

function humanizeToolName(name: string) {
  return name
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getToolDisplayInfo(name: string): ToolDisplayInfo {
  return (
    TOOL_DISPLAY_INFO[name] ?? {
      label: humanizeToolName(name),
      start: `Using ${humanizeToolName(name)}...`,
      complete: `Finished using ${humanizeToolName(name)}.`,
    }
  );
}

function mergeArtifacts(target: Artifact[], artifact: Partial<Artifact> & { id: string }): Artifact {
  const existingIndex = target.findIndex(item => item.id === artifact.id);

  if (existingIndex !== -1) {
    const merged: Artifact = {
      ...target[existingIndex],
      ...artifact,
      metadata: {
        ...(target[existingIndex].metadata ?? {}),
        ...(artifact.metadata ?? {}),
      },
    };
    target[existingIndex] = merged;
    return merged;
  }

  const created: Artifact = {
    id: artifact.id,
    type: (artifact.type ?? 'document') as Artifact['type'],
    title: artifact.title ?? 'Untitled document',
    content: artifact.content ?? '',
    externalUrl: artifact.externalUrl,
    embedUrl: artifact.embedUrl,
    metadata: artifact.metadata ?? {},
  };

  target.push(created);
  return created;
}

function integrateArtifacts(
  artifacts: Artifact[],
  toolName: string,
  toolInput: any,
  toolResult: any
): Artifact[] {
  const updated: Artifact[] = [];

  if (toolName === 'create_document' && toolResult?.documentId) {
    updated.push(
      mergeArtifacts(artifacts, {
        id: toolResult.documentId,
        type: toolInput?.type,
        title: toolInput?.title,
        content: toolInput?.content,
        metadata: toolInput?.metadata,
      })
    );
  } else if (toolName === 'update_document' && toolInput?.documentId) {
    updated.push(
      mergeArtifacts(artifacts, {
        id: toolInput.documentId,
        title: toolInput?.title,
        content: toolInput?.content,
        metadata: toolInput?.metadata,
      })
    );
  }

  if (toolResult && typeof toolResult === 'object') {
    if (toolResult.artifact?.id) {
      updated.push(mergeArtifacts(artifacts, toolResult.artifact));
    }

    if (Array.isArray(toolResult.artifacts)) {
      for (const artifact of toolResult.artifacts) {
        if (artifact?.id) {
          updated.push(mergeArtifacts(artifacts, artifact));
        }
      }
    }
  }

  return updated;
}

function summarizeToolResult(toolName: string, result: any): string | undefined {
  if (!result) return undefined;

  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (!trimmed) return undefined;
    return trimmed.length > 200 ? `${trimmed.slice(0, 197)}…` : trimmed;
  }

  if (typeof result.count === 'number') {
    if (toolName === 'list_files') {
      return result.count === 1
        ? 'Found 1 curriculum file.'
        : `Found ${result.count} curriculum files.`;
    }
    if (toolName === 'search_files') {
      return result.count === 1
        ? 'Found 1 matching result.'
        : `Found ${result.count} matching results.`;
    }
  }

  if (toolName === 'open_file' && typeof result.title === 'string') {
    return `Opened “${result.title}”.`;
  }

  if (toolName === 'copy_section' && typeof result.heading === 'string') {
    return `Copied the “${result.heading}” section.`;
  }

  if (toolName === 'create_document') {
    return 'Draft saved to the artifacts panel.';
  }

  if (toolName === 'update_document') {
    return 'Document updated with the latest changes.';
  }

  if (toolName === 'create_enlighten_assignment') {
    return 'Prepared a mock EnlightenAI assignment overview.';
  }

  if (typeof result.message === 'string') {
    const trimmed = result.message.trim();
    if (trimmed) {
      return trimmed.length > 200 ? `${trimmed.slice(0, 197)}…` : trimmed;
    }
  }

  if (Array.isArray(result.files)) {
    return result.files.length === 1
      ? 'Returned 1 file.'
      : `Returned ${result.files.length} files.`;
  }

  if (Array.isArray(result.results)) {
    return result.results.length === 1
      ? 'Returned 1 result.'
      : `Returned ${result.results.length} results.`;
  }

  return undefined;
}

function safeJsonParse(value: string | undefined) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  let body: any;

  try {
    body = await req.json();
  } catch (error) {
    console.error('Failed to parse chat request body', error);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }

  const { messages = [], currentArtifact = null } = body ?? {};

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
      };

      try {
        const anthropicMessages: any[] = (Array.isArray(messages) ? messages : []).map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));

        let currentResponse = '';
        const toolCalls: ToolCall[] = [];
        const artifacts: Artifact[] = [];
        if (currentArtifact) {
          artifacts.push(currentArtifact as Artifact);
        }

        const totalUsage = {
          input_tokens: 0,
          output_tokens: 0,
        };

        let continueLoop = true;
        let loopCount = 0;
        const MAX_LOOPS = 10;

        while (continueLoop && loopCount < MAX_LOOPS) {
          loopCount += 1;
          send({
            type: 'status',
            message:
              loopCount === 1
                ? 'Thinking through your request...'
                : 'Incorporating what I just found...'
          });

          const toolInputBufferById: Record<string, string> = {};
          const toolIdByIndex: Record<number, string> = {};

          const messageStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
            tools: tools as any,
          });

          for await (const event of messageStream) {
            if (event.type === 'content_block_start') {
              if (event.content_block.type === 'text') {
                const text = event.content_block.text ?? '';
                if (text) {
                  send({ type: 'token', text });
                }
              } else if (event.content_block.type === 'tool_use') {
                const toolUse = event.content_block;
                const info = getToolDisplayInfo(toolUse.name);
                toolIdByIndex[event.index] = toolUse.id;
                toolInputBufferById[toolUse.id] = '';
                send({ type: 'status', message: info.start });
                send({
                  type: 'tool_start',
                  toolCall: {
                    id: toolUse.id,
                    name: toolUse.name,
                    input: toolUse.input ?? {},
                  },
                  description: info.start,
                  label: info.label,
                });
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                const text = event.delta.text ?? '';
                if (text) {
                  send({ type: 'token', text });
                }
              } else if (event.delta.type === 'input_json_delta') {
                const toolId = toolIdByIndex[event.index];
                if (toolId) {
                  toolInputBufferById[toolId] = (toolInputBufferById[toolId] ?? '') + (event.delta.partial_json ?? '');
                }
              }
            }
          }

          const finalMessage = await messageStream.finalMessage();
          totalUsage.input_tokens += finalMessage.usage?.input_tokens ?? 0;
          totalUsage.output_tokens += finalMessage.usage?.output_tokens ?? 0;

          anthropicMessages.push({ role: 'assistant', content: finalMessage.content });

          const textBlocks = finalMessage.content.filter((block: any) => block.type === 'text');
          const iterationText = textBlocks.map((block: any) => block.text ?? '').join('');
          if (iterationText) {
            currentResponse += iterationText;
          }

          const toolUses = finalMessage.content.filter((block: any) => block.type === 'tool_use') as any[];

          if (toolUses.length === 0) {
            continueLoop = false;
          } else {
            for (const toolUse of toolUses) {
              const info = getToolDisplayInfo(toolUse.name);
              let toolInput = toolUse.input;

              if (!toolInput || typeof toolInput !== 'object') {
                toolInput = safeJsonParse(toolInputBufferById[toolUse.id]) ?? toolInput;
              }

              const toolResult = await executeTool(toolUse.name, toolInput);
              const resultSummary = summarizeToolResult(toolUse.name, toolResult);

              toolCalls.push({
                id: toolUse.id,
                name: toolUse.name,
                arguments: toolInput ?? {},
                result: toolResult,
                displayName: info.label,
                friendlyDescription: info.complete,
                status: 'completed',
              });

              const updatedArtifacts = integrateArtifacts(artifacts, toolUse.name, toolInput, toolResult);
              if (updatedArtifacts.length > 0) {
                send({
                  type: 'artifact_update',
                  artifacts: updatedArtifacts,
                  activeArtifactId: updatedArtifacts[updatedArtifacts.length - 1]?.id ?? null,
                });
              }

              send({ type: 'status', message: info.complete });
              send({
                type: 'tool_result',
                toolCall: {
                  id: toolUse.id,
                  name: toolUse.name,
                  input: toolInput ?? {},
                  result: toolResult,
                },
                description: info.complete,
                label: info.label,
                resultSummary,
              });

              anthropicMessages.push({
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(toolResult),
                  },
                ],
              });
            }

            send({
              type: 'status',
              message: 'Using that information to keep drafting your answer...'
            });
          }
        }

        let followUpSuggestions: string[] = [];
        try {
          const conversationForSuggestions = [
            ...(Array.isArray(messages) ? messages : []),
            { role: 'assistant', content: currentResponse },
          ];

          const conversationText = conversationForSuggestions
            .map((msg: any) => {
              const speaker = msg.role === 'assistant' ? 'Assistant' : 'Teacher';
              const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
              return `${speaker}: ${content}`;
            })
            .join('\n');

          const suggestionResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 512,
            temperature: 0.3,
            system:
              'You are an expert instructional coach helping teachers extend a conversation with a curriculum assistant. Suggest pedagogically sound follow-up questions that keep the coaching dialogue moving forward.',
            messages: [
              {
                role: 'user',
                content: `Conversation so far:\n${conversationText}\n\nProvide 3 or 4 concise follow-up questions the teacher could ask next. Respond ONLY with a valid JSON array of strings.`,
              },
            ],
          });

          const suggestionText = (suggestionResponse.content ?? [])
            .filter((item: any) => item.type === 'text')
            .map((item: any) => item.text)
            .join('');

          const parsedSuggestions = JSON.parse(suggestionText);
          if (Array.isArray(parsedSuggestions)) {
            followUpSuggestions = parsedSuggestions
              .filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
              .slice(0, 4);
          }
        } catch (suggestionError) {
          console.error('Follow-up suggestion generation error:', suggestionError);
        }

        send({ type: 'status', message: 'All set! Sharing the response now.' });

        send({
          type: 'complete',
          response: currentResponse,
          toolCalls,
          artifact: artifacts.length > 0 ? artifacts[artifacts.length - 1] : null,
          artifactList: artifacts,
          followUpSuggestions,
          usage: totalUsage,
        });
      } catch (error: any) {
        console.error('Chat streaming error:', error);
        send({
          type: 'error',
          message:
            error?.message ?? 'Something went wrong while talking to the assistant. Please try again in a moment.',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

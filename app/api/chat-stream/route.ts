import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { tools, executeTool } from '@/lib/tools';
import { courses, units } from '@/lib/curriculum-data';

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

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { messages, currentArtifact } = await req.json();

        // Convert messages to Anthropic format
        const anthropicMessages = messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));

        let currentResponse = '';
        let toolCalls: any[] = [];
        let artifacts: any[] = currentArtifact ? [currentArtifact] : [];

        // Main loop for tool use
        let continueLoop = true;
        let loopCount = 0;
        const MAX_LOOPS = 10;

        while (continueLoop && loopCount < MAX_LOOPS) {
          loopCount++;

          const stream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            messages: anthropicMessages,
            tools: tools as any,
          });

          // Stream text chunks
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text;
              currentResponse += text;

              // Send text delta to client
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`)
              );
            }
          }

          const response = await stream.finalMessage();

          // Process tool uses
          const hasToolUse = response.content.some((c: any) => c.type === 'tool_use');

          if (hasToolUse) {
            for (const content of response.content) {
              if (content.type === 'tool_use') {
                // Send tool use notification
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_use',
                    toolName: content.name
                  })}\n\n`)
                );

                // Execute tool
                const toolResult = await executeTool(content.name, content.input);

                toolCalls.push({
                  id: content.id,
                  name: content.name,
                  input: content.input,
                  result: toolResult
                });

                // If tool creates/updates document, add to artifacts
                if (content.name === 'create_document') {
                  const input = content.input as any;
                  const newArtifact = {
                    id: toolResult.documentId,
                    type: input.type,
                    title: input.title,
                    content: input.content,
                    metadata: input.metadata || {}
                  };
                  artifacts.push(newArtifact);

                  // Send artifact to client
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'artifact',
                      artifact: newArtifact
                    })}\n\n`)
                  );
                } else if (content.name === 'update_document') {
                  const input = content.input as any;
                  const idx = artifacts.findIndex(a => a.id === input.documentId);
                  if (idx !== -1) {
                    artifacts[idx] = {
                      ...artifacts[idx],
                      content: input.content,
                      title: input.title || artifacts[idx].title
                    };

                    // Send updated artifact to client
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({
                        type: 'artifact',
                        artifact: artifacts[idx]
                      })}\n\n`)
                    );
                  }
                }

                // Add tool result to conversation
                anthropicMessages.push({
                  role: 'assistant',
                  content: response.content
                });

                anthropicMessages.push({
                  role: 'user',
                  content: [{
                    type: 'tool_result',
                    tool_use_id: content.id,
                    content: JSON.stringify(toolResult)
                  }]
                });
              }
            }
          }

          continueLoop = hasToolUse && response.stop_reason === 'tool_use';
        }

        // Send final message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            toolCalls,
            artifacts: artifacts.length > 0 ? artifacts[artifacts.length - 1] : null
          })}\n\n`)
        );

        controller.close();
      } catch (error: any) {
        console.error('Streaming error:', error);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

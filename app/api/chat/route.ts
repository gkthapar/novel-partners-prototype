import { NextRequest, NextResponse } from 'next/server';
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

IMPORTANT: When answering questions about curriculum content:
1. ALWAYS use the fetch_google_doc tool FIRST to get the REAL content from Novel Partners Google Docs
2. The fetch_google_doc tool loads the actual, up-to-date curriculum content - use this instead of mock data
3. Answer questions based on the ACTUAL content from the Google Docs, not made-up information
4. When a teacher asks about a lesson, immediately fetch the Google Doc to see what's actually in it

When helping teachers:
1. Always ground your responses in the actual curriculum files using the tools available
2. Use fetch_google_doc to get real content, then reference it accurately
3. Provide specific citations to files, sections, and page numbers from the actual content
4. When creating documents, use the create_document tool to display them in the artifacts panel
5. When copying curriculum text, use copy_section to get verbatim text
6. When adapting materials, clearly state what changes you're making and why
7. For ELL adaptations, include:
   - Simplified vocabulary where appropriate
   - Sentence frames for writing tasks
   - Visual supports when relevant
8. For assessments, align to the performance task rubric and standards

Be conversational, helpful, and teacher-focused. You're here to save teachers time and help them create excellent learning experiences.`;

export async function POST(req: NextRequest) {
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

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
        tools: tools as any,
      });

      // Process response
      for (const content of response.content) {
        if (content.type === 'text') {
          currentResponse += content.text;
        } else if (content.type === 'tool_use') {
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
            artifacts.push({
              id: toolResult.documentId,
              type: input.type,
              title: input.title,
              content: input.content,
              metadata: input.metadata || {}
            });
          } else if (content.name === 'update_document') {
            const input = content.input as any;
            // Update existing artifact
            const idx = artifacts.findIndex(a => a.id === input.documentId);
            if (idx !== -1) {
              artifacts[idx] = {
                ...artifacts[idx],
                content: input.content,
                title: input.title || artifacts[idx].title
              };
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

      // Check if we should continue (if there are tool uses)
      const hasToolUse = response.content.some((c: any) => c.type === 'tool_use');
      continueLoop = hasToolUse && response.stop_reason === 'tool_use';
    }

    return NextResponse.json({
      response: currentResponse,
      toolCalls,
      artifacts: artifacts.length > 0 ? artifacts[artifacts.length - 1] : null,
      usage: {
        input_tokens: 0,
        output_tokens: 0
      }
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

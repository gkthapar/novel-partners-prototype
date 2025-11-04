# Novel Partners CEO Demo Notes

## What We Built

A production-quality prototype of the Novel Partners Curriculum Assistant that demonstrates how AI can help teachers work with curriculum materials inside EnlightenAI.

### Key Demo Points for Carrie (Novel Partners CEO)

1. **Natural Conversation**: Teachers can ask questions in plain English, no training needed
2. **Grounded in Curriculum**: Every response cites specific Novel Partners files
3. **Material Creation**: Creates lesson plans, handouts, and assessments in real-time
4. **Smart Adaptation**: Automatically adapts for ELL students while maintaining standards alignment
5. **Integration Ready**: Shows how this would connect to EnlightenAI for assignments

## Demo Flow (5-7 minutes)

### Opening (30 seconds)
"Carrie, this is a prototype of how Novel Partners curriculum could be integrated into EnlightenAI with an AI assistant. It's using your actual curriculum structure from the Binti unit."

### Demo 1: Browse Curriculum (1 minute)
**Say**: "Let me show you how a teacher would explore your materials"

**Type**: "Show me the teacher guide for Unit 1 Lesson 1"

**Point out**:
- The agent searches and finds the exact file
- Returns the full guide with all sections
- Notice the structured format - objectives, materials, activities

### Demo 2: Create Adapted Materials (2 minutes)
**Say**: "One of our teachers has newcomer ELLs who need scaffolding. Watch this:"

**Type**: "Create an ELL-adapted version of the character analysis chart for Lexile 700-800"

**Point out**:
- Artifact appears on the right (like Claude.ai)
- Content is simplified but aligned to same standards
- Includes sentence frames
- She can edit it directly or export

**Action**: Click "Edit" to show the editable interface

### Demo 3: Generate Assessment (1.5 minutes)
**Say**: "Teachers love how it creates assessments aligned to your rubrics"

**Type**: "Make a 2-paragraph exit ticket on theme and belonging aligned to the rubric"

**Point out**:
- Uses the actual rubric from the unit
- Creates standards-aligned prompt
- Includes success criteria
- "Send to EnlightenAI" button (mock for demo)

### Demo 4: Lesson Planning (1.5 minutes)
**Say**: "And it helps with planning too"

**Type**: "Help me plan a 20-minute mini-lesson on cultural identity using the Binti curriculum"

**Point out**:
- Pulls from actual curriculum content
- Includes timing, activities, discussion questions
- References specific pages from Binti
- Ready to use tomorrow

### Closing (30 seconds)
**Say**: "This is a working prototype. The real version would:
- Work across all your grade levels and units
- Store teacher customizations
- Post directly to EnlightenAI with one click
- Track which materials are most used
- Learn from teacher edits to get better over time"

## Technical Highlights (If She Asks)

- **AI Model**: Claude 4.5 Sonnet (Anthropic's latest)
- **Architecture**: Tool-using agent that searches curriculum files
- **Integration**: API-based, can connect to any LMS
- **Privacy**: Curriculum stays on your servers
- **Customization**: Can adapt to any curriculum structure

## Questions She Might Ask

**Q: "Can it work with our other units?"**
A: Yes, we built this with one unit as a proof of concept. The same architecture works across all your materials. We'd just need to ingest the other units.

**Q: "What about copyright?"**
A: The system only stores metadata and short excerpts. Full text is never stored or shared. Each search references your original files.

**Q: "How accurate is it?"**
A: It's excellent at finding and citing materials. For content generation, teachers review before using - think of it as a smart first draft.

**Q: "What do you need from us?"**
A:
1. Sample curriculum files (PDFs, docs) from 2-3 units
2. Your standards alignment maps
3. Any rubrics you want the AI to reference
4. A pilot teacher for feedback

**Q: "Timeline?"**
A:
- Pilot with 1 course: 4-6 weeks
- Full grade level: 8-10 weeks
- District-wide: 3-4 months

**Q: "Cost?"**
A: Pricing would be per-teacher seat as part of EnlightenAI, similar to how other premium features are priced.

## Success Metrics to Mention

From PRD:
- Teachers find materials in under 60 seconds (vs. 5-10 minutes manually)
- 70% of planning conversations include curriculum citations
- 50% of teachers create assessments weekly via assistant
- 50% reduction in "file hunting" time

## Partnership Talking Points

1. **Your Curriculum, Our Platform**: Novel Partners content + EnlightenAI's assessment engine
2. **Teacher Success**: Makes high-quality curriculum more accessible and usable
3. **Data Insights**: See which lessons, materials, and adaptations work best
4. **Ongoing Revenue**: Strengthens Novel Partners' value prop to districts
5. **Market Differentiator**: First curriculum company with AI-native teacher support

## Backup Prompts (If Demo Stalls)

- "List all performance tasks in this unit"
- "What are the learning objectives for Lesson 2?"
- "Create a Do Now activity for introducing Binti"
- "Show me the rubric for the literary analysis essay"
- "Make a vocabulary list from the teacher guide"

## After the Demo

**Next Steps to Propose**:
1. Schedule follow-up with Novel Partners curriculum team
2. Get access to 2-3 more units for expanded prototype
3. Identify 3-5 pilot teachers
4. Set up bi-weekly check-ins
5. Target pilot launch date

**Materials to Send**:
- This demo link (once deployed)
- Technical architecture doc
- Partnership proposal outline
- Pilot teacher recruitment plan

## Deployment Notes

For live demo, deploy to Vercel:
```bash
vercel deploy
```

Or run locally:
```bash
npm run dev
```

Make sure ANTHROPIC_API_KEY is set in environment variables.

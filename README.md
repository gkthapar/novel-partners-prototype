# Novel Partners Curriculum Assistant

An AI-powered curriculum assistant for Novel Partners ELA materials, featuring a Claude-style chat interface with artifacts for creating and editing teaching materials.

## Features

- **Chat Interface**: Natural language conversation with curriculum context
- **Artifacts Panel**: Create, edit, and export lesson plans, handouts, and assessments
- **Curriculum Tools**: Search, browse, and reference Novel Partners materials
- **Material Adaptation**: Automatically adapt content for ELL students, IEP accommodations, or different reading levels
- **Assessment Creation**: Generate exit tickets and performance tasks aligned to rubrics
- **EnlightenAI Integration**: Mock integration for creating assignments (demo mode)

## Demo Scope

This prototype includes:
- Grade 9 English I - Foundations of Literature
- Unit 1: Binti by Nnedi Okorafor
- 4 sample lessons with teacher guides, student handouts, and assessments
- Full tool suite for curriculum interaction

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. Clone and navigate to the project:
```bash
cd novel-partners-prototype
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Try These Prompts

1. **Browse curriculum**: "Show me the teacher guide for Unit 1 Lesson 1"

2. **Create adapted materials**: "Create an ELL-adapted version of the character analysis chart for Lexile 700-800"

3. **Generate assessments**: "Make a 2-paragraph exit ticket on theme and belonging aligned to the rubric"

4. **List resources**: "List all performance tasks in this unit"

5. **Plan lessons**: "Help me plan a 20-minute mini-lesson on cultural identity using the Binti curriculum"

### Context Selectors

Use the dropdown menus at the top to:
- Select Course (Grade 9 English I)
- Select Unit (Unit 1: Binti)
- Select Lesson (optional)

Or just ask questions naturally - the assistant will find the right materials.

### Artifacts Panel

When the assistant creates documents, they appear in the artifacts panel on the right where you can:
- **Edit**: Click "Edit" to modify the content directly
- **Preview**: Toggle between edit and preview modes
- **Export**: Download as Markdown file
- **Send to EnlightenAI**: Mock integration (shows what would be sent)

## Architecture

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **AI Model**: Claude 4.5 Sonnet (via Anthropic API)
- **UI**: React, Tailwind CSS, Radix UI components
- **Language**: TypeScript

### Project Structure

```
novel-partners-prototype/
├── app/
│   ├── api/chat/          # Chat API endpoint
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/
│   ├── ui/               # Reusable UI components
│   ├── chat-interface.tsx # Main chat UI
│   └── artifact-panel.tsx # Artifact display/editing
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── curriculum-data.ts # Mock curriculum data
│   ├── tools.ts          # Agent tool implementations
│   └── utils.ts          # Utilities
└── public/               # Static assets
```

### Agent Tools

The assistant has access to these tools:

1. **list_files**: Browse curriculum by course, unit, lesson, or file type
2. **search_files**: Full-text search across all materials
3. **open_file**: Read complete curriculum files
4. **copy_section**: Extract exact text from specific sections
5. **create_document**: Generate new materials in artifacts panel
6. **update_document**: Revise existing artifacts
7. **create_enlighten_assignment**: Mock EnlightenAI API integration

## Sample Data

The prototype includes rich sample data:
- **Course**: Grade 9 English I - Foundations of Literature
- **Unit**: Unit 1 - Binti (Nnedi Okorafor)
- **Lessons**: 4 complete lessons with:
  - Teacher guides with objectives, activities, and differentiation
  - Student handouts and graphic organizers
  - Performance task with detailed rubric
  - Standards alignment (Common Core)

## Adding Real Curriculum Files

To add your actual Novel Partners files:

1. Add PDF/DOCX files to a `/curriculum` folder
2. Update `lib/curriculum-data.ts` with file metadata
3. Implement PDF/DOCX parsing in `lib/tools.ts` (libraries already included in package.json)
4. Rebuild the index with real content

## Mock Features

For this demo, the following are mocked:
- EnlightenAI API integration (shows payload but doesn't actually post)
- Student results analysis (would pull from real EnlightenAI data)
- Full vector search (using simple text search for demo)

## Production Considerations

To make this production-ready:

1. **Content Ingestion**: Build a proper PDF/DOCX parser and vector store
2. **EnlightenAI Integration**: Implement real API calls with authentication
3. **User Authentication**: Add teacher accounts and permissions
4. **File Management**: Support file uploads and curriculum versioning
5. **Database**: Store conversation history, custom materials, and user preferences
6. **Deployment**: Deploy to Vercel or similar platform
7. **Licensing**: Confirm copyright permissions with Novel Partners

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |

## License

Proprietary - Novel Partners Partnership Demo

## Contact

For questions about this prototype, contact the development team.

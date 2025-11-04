# Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- An Anthropic API key (get one at https://console.anthropic.com/)

## Setup Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**

   Create a `.env.local` file in the project root:
   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. **Run the Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Prompts to Try

Once the app is running, try these prompts:

1. **Browse curriculum**:
   - "Show me the teacher guide for Unit 1 Lesson 1"
   - "List all performance tasks in this unit"

2. **Create adapted materials**:
   - "Create an ELL-adapted version of the character analysis chart for Lexile 700-800"
   - "Make a simplified version of the Lesson 1 teacher guide for newcomer ELLs"

3. **Generate assessments**:
   - "Make a 2-paragraph exit ticket on theme and belonging aligned to the rubric"
   - "Create a quick formative assessment on character development"

4. **Plan lessons**:
   - "Help me plan a 20-minute mini-lesson on cultural identity using the Binti curriculum"
   - "Give me a lesson plan outline for teaching character transformation"

## UI Features

### Context Selectors
- Use the dropdowns at the top to select Course, Unit, and Lesson
- Or just ask questions naturally - the agent will find the right materials

### Artifacts Panel
When the agent creates documents, they appear on the right where you can:
- **Edit**: Click "Edit" to modify content
- **Preview**: Toggle between edit and preview modes
- **Export**: Download as Markdown
- **Send to EnlightenAI**: See the mock integration payload

### Chat Interface
- Type naturally or use the suggested prompts
- The agent uses curriculum tools to search and reference materials
- Citations show which files and sections were used

## Troubleshooting

### "API key not found" error
Make sure your `.env.local` file exists and contains a valid Anthropic API key starting with `sk-ant-`

### Build errors
Try:
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Port 3000 already in use
```bash
npm run dev -- -p 3001
```

## Next Steps

To prepare for the CEO demo:

1. **Add Your API Key**: Replace the placeholder in `.env.local` with your real key
2. **Test the Prompts**: Try all 5 demo prompts to ensure they work
3. **Customize Sample Data**: If you want to use real Novel Partners files, add them to `lib/curriculum-data.ts`
4. **Polish**: Review the UI and make any desired styling tweaks

## Demo Day Checklist

- [ ] API key is configured and working
- [ ] Tested all demo prompts
- [ ] Browser is at localhost:3000
- [ ] Chrome DevTools is closed (for clean demo)
- [ ] Have backup prompts ready
- [ ] Explained: "This is a prototype to show how Novel Partners + EnlightenAI integration could work"

## Support

For technical issues, check:
- README.md for detailed documentation
- PRD in the project brief for feature requirements
- Console logs for error messages

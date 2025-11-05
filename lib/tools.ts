import {
  resources,
  lessons,
  units,
  courses,
  getAllResources,
  searchResources,
  getResourcesByLessonId,
  getLessonsByUnitId,
  getUnitsByCourseId
} from './curriculum-data';
import { Artifact, Resource } from './types';

// Tool definitions for Claude
export const tools = [
  {
    name: 'list_files',
    description: 'List curriculum files and folders. Can filter by course, unit, lesson, or file type.',
    input_schema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'string',
          description: 'Optional: Filter by course ID'
        },
        unitId: {
          type: 'string',
          description: 'Optional: Filter by unit ID'
        },
        lessonId: {
          type: 'string',
          description: 'Optional: Filter by lesson ID'
        },
        fileType: {
          type: 'string',
          enum: ['teacher_guide', 'student_handout', 'assessment', 'slides'],
          description: 'Optional: Filter by file type'
        }
      }
    }
  },
  {
    name: 'search_files',
    description: 'Search curriculum files by keyword. Searches titles, headings, and content.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query'
        },
        fileType: {
          type: 'string',
          enum: ['teacher_guide', 'student_handout', 'assessment', 'slides'],
          description: 'Optional: Filter results by file type'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'open_file',
    description: 'Open and read a curriculum file. Returns the full content with headings.',
    input_schema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The ID of the file to open'
        },
        section: {
          type: 'string',
          description: 'Optional: Specific section heading to focus on'
        }
      },
      required: ['fileId']
    }
  },
  {
    name: 'copy_section',
    description: 'Copy exact text from a specific section of a curriculum file. Returns verbatim text.',
    input_schema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The ID of the file'
        },
        heading: {
          type: 'string',
          description: 'The heading/section to copy (e.g., "Guided Practice", "Learning Objectives")'
        }
      },
      required: ['fileId', 'heading']
    }
  },
  {
    name: 'create_document',
    description: 'Create a new document (handout, lesson plan, assessment, etc.) that will be displayed in the artifacts panel.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Document title'
        },
        type: {
          type: 'string',
          enum: ['document', 'lesson_plan', 'assessment', 'handout'],
          description: 'Type of document to create'
        },
        content: {
          type: 'string',
          description: 'The markdown or HTML content of the document'
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata like course, unit, lesson, adaptedFor, standards'
        }
      },
      required: ['title', 'type', 'content']
    }
  },
  {
    name: 'update_document',
    description: 'Update an existing document with new content or revisions.',
    input_schema: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'The ID of the document to update'
        },
        content: {
          type: 'string',
          description: 'The new content (will replace existing content)'
        },
        title: {
          type: 'string',
          description: 'Optional: Update the document title'
        }
      },
      required: ['documentId', 'content']
    }
  },
  {
    name: 'create_enlighten_assignment',
    description: 'Create an assignment in EnlightenAI (mocked for demo). Returns an assignment ID.',
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Assignment title'
        },
        gradeLevel: {
          type: 'string',
          description: 'Grade level (e.g., "9")'
        },
        prompt: {
          type: 'string',
          description: 'The assignment prompt/instructions'
        },
        rubric: {
          type: 'string',
          description: 'Rubric ID or rubric content'
        },
        expectedLength: {
          type: 'string',
          description: 'Expected response length (e.g., "2-3 paragraphs", "500 words")'
        },
        courseId: {
          type: 'string',
          description: 'Course ID'
        },
        courseName: {
          type: 'string',
          description: 'Human-readable course name for display'
        },
        unitTitle: {
          type: 'string',
          description: 'Unit title for context chips'
        },
        readings: {
          type: 'array',
          description: 'Reference texts or readings students should use',
          items: { type: 'string' }
        },
        aiFeedbackLength: {
          type: 'string',
          description: 'Length of AI-generated feedback (e.g., "One paragraph")'
        },
        aiFeedbackStyle: {
          type: 'string',
          description: 'Feedback tone/style (e.g., "Glows and grows")'
        },
        gradingNotes: {
          type: 'string',
          description: 'Specific grading or feedback instructions for the AI'
        },
        revisionOpportunities: {
          type: 'number',
          description: 'Number of revision opportunities students receive'
        },
        deliveryMode: {
          type: 'string',
          description: 'How feedback is delivered (e.g., "I\'ll grade this assignment later with AI assistance")'
        },
        sharingPreference: {
          type: 'string',
          description: 'Who has visibility to the assignment (e.g., "My classroom use only")'
        },
        assignToClasses: {
          type: 'array',
          description: 'Classes or sections the assignment should be published to',
          items: { type: 'string' }
        },
        disablePasting: {
          type: 'boolean',
          description: 'Whether to prevent students from pasting text into the response field'
        },
        aiTrainingExamples: {
          type: 'array',
          description: 'Optional exemplar responses to train the AI grader',
          items: { type: 'string' }
        }
      },
      required: ['title', 'gradeLevel', 'prompt', 'rubric']
    }
  }
];

// Tool execution functions
export async function executeTool(toolName: string, args: any): Promise<any> {
  switch (toolName) {
    case 'list_files':
      return listFiles(args);
    case 'search_files':
      return searchFiles(args);
    case 'open_file':
      return openFile(args);
    case 'copy_section':
      return copySection(args);
    case 'create_document':
      return createDocument(args);
    case 'update_document':
      return updateDocument(args);
    case 'create_enlighten_assignment':
      return createEnlightenAssignment(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

const resourceTypeToArtifactType: Record<Resource['type'], Artifact['type']> = {
  teacher_guide: 'lesson_plan',
  student_handout: 'handout',
  assessment: 'assessment',
  slides: 'document'
};

function buildGoogleDocEmbedUrl(url?: string) {
  if (!url) return undefined;

  if (url.includes('docs.google.com/document')) {
    if (url.includes('/preview')) return url;
    if (url.includes('/edit')) {
      return url.replace(/\/edit[^#?]*/, '/preview');
    }
    if (url.includes('/view')) {
      return url.replace(/\/view[^#?]*/, '/preview');
    }
  }

  if (url.includes('docs.google.com/presentation')) {
    if (url.includes('/preview')) return url;
    return url.replace(/\/edit[^#?]*/, '/embed');
  }

  if (url.includes('drive.google.com')) {
    if (url.includes('/preview')) return url;
    return url.replace(/\/view[^#?]*/, '/preview');
  }

  return url;
}

function listFiles(args: any) {
  let filtered = [...resources];

  if (args.lessonId) {
    filtered = getResourcesByLessonId(args.lessonId);
  } else if (args.unitId) {
    const lessonIds = getLessonsByUnitId(args.unitId).map(l => l.id);
    filtered = resources.filter(r => lessonIds.includes(r.lessonId));
  } else if (args.courseId) {
    const unitIds = getUnitsByCourseId(args.courseId).map(u => u.id);
    const lessonIds = lessons.filter(l => unitIds.includes(l.unitId)).map(l => l.id);
    filtered = resources.filter(r => lessonIds.includes(r.lessonId));
  }

  if (args.fileType) {
    filtered = filtered.filter(r => r.type === args.fileType);
  }

  const result = filtered.map(r => {
    const lesson = lessons.find(l => l.id === r.lessonId);
    const unit = lesson ? units.find(u => u.id === lesson.unitId) : null;
    const course = unit ? courses.find(c => c.id === unit.courseId) : null;

    return {
      id: r.id,
      title: r.title,
      type: r.type,
      path: r.path,
      lesson: lesson?.title,
      unit: unit?.title,
      course: course?.name,
      headings: r.headings
    };
  });

  return {
    files: result,
    count: result.length
  };
}

function searchFiles(args: any) {
  let results = searchResources(args.query);

  if (args.fileType) {
    results = results.filter(r => r.type === args.fileType);
  }

  const formatted = results.map(r => {
    const lesson = lessons.find(l => l.id === r.lessonId);
    const unit = lesson ? units.find(u => u.id === lesson.unitId) : null;

    // Find matching excerpts
    const lowerQuery = args.query.toLowerCase();
    const contentLines = r.content.split('\n');
    const matchingLines = contentLines
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => line.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .map(({ line, idx }) => {
        const start = Math.max(0, line.toLowerCase().indexOf(lowerQuery) - 50);
        const end = Math.min(line.length, start + 150);
        return '...' + line.slice(start, end) + '...';
      });

    return {
      id: r.id,
      title: r.title,
      type: r.type,
      lesson: lesson?.title,
      unit: unit?.title,
      relevance: 'high',
      excerpts: matchingLines
    };
  });

  return {
    results: formatted,
    count: formatted.length,
    query: args.query
  };
}

function openFile(args: any) {
  const resource = resources.find(r => r.id === args.fileId);

  if (!resource) {
    return { error: 'File not found', fileId: args.fileId };
  }

  const lesson = lessons.find(l => l.id === resource.lessonId);
  const unit = lesson ? units.find(u => u.id === lesson.unitId) : null;
  const course = unit ? courses.find(c => c.id === unit.courseId) : null;

  let content = resource.content;

  // If specific section requested, extract it
  if (args.section) {
    const lines = content.split('\n');
    const sectionStart = lines.findIndex(line =>
      line.toLowerCase().includes(args.section.toLowerCase()) ||
      line.trim().toLowerCase() === args.section.toLowerCase()
    );

    if (sectionStart !== -1) {
      // Find next heading or end of content
      let sectionEnd = lines.length;
      for (let i = sectionStart + 1; i < lines.length; i++) {
        if (lines[i].startsWith('#') && !lines[i].startsWith('###')) {
          sectionEnd = i;
          break;
        }
      }
      content = lines.slice(sectionStart, sectionEnd).join('\n');
    }
  }

  const googleDocUrl = resource.metadata?.googleDocUrl as string | undefined;
  const externalUrl = googleDocUrl || (resource.metadata?.externalUrl as string | undefined) || resource.path;
  const embedUrl = resource.metadata?.googleDocEmbedUrl as string | undefined || buildGoogleDocEmbedUrl(googleDocUrl || (resource.metadata?.externalUrl as string | undefined));

  const artifact: Artifact = {
    id: `resource-${resource.id}`,
    type: resourceTypeToArtifactType[resource.type] ?? 'document',
    title: resource.title,
    content: '',
    externalUrl,
    embedUrl,
    metadata: {
      course: course?.name,
      unit: unit?.title,
      lesson: lesson?.title,
      sourceFileId: resource.id,
      sourceFileType: resource.type,
      ...(resource.metadata || {})
    }
  };

  return {
    id: resource.id,
    title: resource.title,
    type: resource.type,
    path: resource.path,
    course: course?.name,
    unit: unit?.title,
    lesson: lesson?.title,
    headings: resource.headings,
    content,
    artifact
  };
}

function copySection(args: any) {
  const resource = resources.find(r => r.id === args.fileId);

  if (!resource) {
    return { error: 'File not found', fileId: args.fileId };
  }

  const lines = resource.content.split('\n');
  const heading = args.heading;

  // Find the section
  const sectionStart = lines.findIndex(line =>
    line.toLowerCase().includes(heading.toLowerCase()) ||
    line.trim().toLowerCase() === heading.toLowerCase()
  );

  if (sectionStart === -1) {
    return {
      error: 'Section not found',
      heading: heading,
      availableHeadings: resource.headings
    };
  }

  // Find next heading or end
  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i].startsWith('##') && !lines[i].startsWith('###')) {
      sectionEnd = i;
      break;
    }
  }

  const sectionContent = lines.slice(sectionStart, sectionEnd).join('\n').trim();

  return {
    fileId: args.fileId,
    heading: heading,
    content: sectionContent,
    note: 'This is verbatim text from the curriculum file.'
  };
}

function createDocument(args: any) {
  // In a real app, this would save to a database
  // For demo, we return the document structure
  const documentId = `doc-${Date.now()}`;

  return {
    documentId,
    title: args.title,
    type: args.type,
    content: args.content,
    metadata: args.metadata || {},
    created: new Date().toISOString(),
    message: 'Document created and displayed in artifacts panel'
  };
}

function updateDocument(args: any) {
  return {
    documentId: args.documentId,
    content: args.content,
    title: args.title,
    updated: new Date().toISOString(),
    message: 'Document updated'
  };
}

function createEnlightenAssignment(args: any) {
  // Mock EnlightenAI API call
  const assignmentId = `assign-${Date.now()}`;

  const readings = Array.isArray(args.readings) ? args.readings : args.readings ? [args.readings] : [];
  const aiTrainingExamples = Array.isArray(args.aiTrainingExamples)
    ? args.aiTrainingExamples
    : args.aiTrainingExamples
    ? [args.aiTrainingExamples]
    : [];

  const metadata = {
    course: args.courseName,
    unit: args.unitTitle,
    gradeLevel: args.gradeLevel
  };

  const buildFieldRow = (label: string, value?: string | number | boolean | string[]) => {
    if (value === undefined || value === null || value === '') {
      return `- **${label}:** _Teacher can adjust during publish_`;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `- **${label}:** _Teacher can adjust during publish_`;
      }
      return `- **${label}:**\n${value.map(item => `  - ${item}`).join('\n')}`;
    }
    const stringValue = String(value);
    if (stringValue.includes('\n')) {
      const indented = stringValue.split('\n').map(line => `  ${line}`).join('\n');
      return `- **${label}:**\n${indented}`;
    }
    return `- **${label}:** ${stringValue}`;
  };

  const assignmentDetails = [
    buildFieldRow('Assignment title', args.title),
    buildFieldRow('Expected submission length', args.expectedLength ?? '2-3 paragraphs'),
    buildFieldRow('Grade level', args.gradeLevel),
    buildFieldRow('Rubric', args.rubric),
    buildFieldRow('Task description and prompt', args.prompt),
    buildFieldRow(
      'Readings or reference text',
      readings.length ? readings.map((reading: string) => `“${reading}”`) : ['Core Binti mentor text excerpts']
    )
  ].join('\n');

  const aiTraining = [
    buildFieldRow('Expected feedback length', args.aiFeedbackLength ?? 'One paragraph'),
    buildFieldRow('Style of feedback', args.aiFeedbackStyle ?? 'Glows and grows'),
    buildFieldRow('Specific grading and feedback instructions', args.gradingNotes ?? 'Reference Novel Partners rubric language.'),
    buildFieldRow(
      'Train your AI with examples',
      aiTrainingExamples.length
        ? aiTrainingExamples.map((example: string, idx: number) => `Example ${idx + 1}: ${example}`)
        : ['Example 1: _Teacher can paste an exemplar later_']
    )
  ].join('\n');

  const publishSettings = [
    buildFieldRow('Who can access this assignment?', args.sharingPreference ?? 'My classroom use only'),
    buildFieldRow('How would you like to deliver feedback?', args.deliveryMode ?? "I'll grade this assignment later with AI assistance"),
    buildFieldRow('How many revision opportunities?', args.revisionOpportunities ?? 1),
    buildFieldRow(
      'Assign to classes',
      Array.isArray(args.assignToClasses) && args.assignToClasses.length
        ? args.assignToClasses
        : ['Grade 9 English I - Period 1']
    ),
    buildFieldRow('Disable pasting for students', args.disablePasting ? 'Enabled' : 'Disabled')
  ].join('\n');

  const content = `# EnlightenAI Assignment Builder

Use the fields below to mirror the Enlighten.ai publish flow. Everything is pre-filled with Novel Partners curriculum context so the teacher can verify and publish in a few clicks.

## Step 1 · Assignment details
${assignmentDetails}

## Step 2 · AI training (optional)
${aiTraining}

## Step 3 · Publish assignment
${publishSettings}

---
- Assignment URL (demo): https://enlighten-ai.com/assignments/${assignmentId}
- Next action: Open Enlighten.ai, confirm the pre-filled values, then click **Publish assignment**.`;

  return {
    assignmentId,
    status: 'created',
    title: args.title,
    gradeLevel: args.gradeLevel,
    courseId: args.courseId,
    prompt: args.prompt,
    rubric: args.rubric,
    expectedLength: args.expectedLength,
    url: `https://enlighten-ai.com/assignments/${assignmentId}`,
    message: 'Assignment created in EnlightenAI (demo mode)',
    note: 'This is a mock assignment. In production, this would post to the real EnlightenAI API.',
    artifact: {
      id: `enlighten-${assignmentId}`,
      type: 'assessment',
      title: `${args.title} · EnlightenAI Flow`,
      content,
      metadata
    }
  };
}

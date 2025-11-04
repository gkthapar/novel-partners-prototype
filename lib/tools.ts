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
import { Resource } from './types';
import { fetchGoogleDoc, htmlToMarkdown } from './google-docs';

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
    name: 'fetch_google_doc',
    description: 'Fetch the actual content from a Google Doc curriculum file. This loads the REAL content from Novel Partners Google Docs into the conversation for answering questions. Use this to get the actual curriculum content instead of the mock data.',
    input_schema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The ID of the curriculum file that has a Google Doc link'
        }
      },
      required: ['fileId']
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
    case 'fetch_google_doc':
      return fetchGoogleDocTool(args);
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

  return {
    id: resource.id,
    title: resource.title,
    type: resource.type,
    path: resource.path,
    course: course?.name,
    unit: unit?.title,
    lesson: lesson?.title,
    headings: resource.headings,
    content: content
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

async function fetchGoogleDocTool(args: any) {
  const resource = resources.find(r => r.id === args.fileId);

  if (!resource) {
    return { error: 'File not found', fileId: args.fileId };
  }

  if (!resource.googleDocUrl) {
    return {
      error: 'This file does not have a Google Doc link',
      fileId: args.fileId,
      note: 'Use open_file instead for files without Google Doc links'
    };
  }

  try {
    // Fetch the actual Google Doc content
    const docData = await fetchGoogleDoc(resource.googleDocUrl);

    // Convert HTML to clean markdown
    const markdown = htmlToMarkdown(docData.html);

    const lesson = lessons.find(l => l.id === resource.lessonId);
    const unit = lesson ? units.find(u => u.id === lesson.unitId) : null;
    const course = unit ? courses.find(c => c.id === unit.courseId) : null;

    return {
      fileId: resource.id,
      title: docData.title,
      type: resource.type,
      course: course?.name,
      unit: unit?.title,
      lesson: lesson?.title,
      googleDocUrl: docData.url,
      content: markdown,
      rawText: docData.content,
      note: 'This is the REAL content from the Novel Partners Google Doc. Use this to answer questions accurately.',
      fetchedAt: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      error: 'Failed to fetch Google Doc',
      message: error.message,
      fileId: args.fileId,
      googleDocUrl: resource.googleDocUrl,
      note: 'Make sure the Google Doc is shared with "Anyone with the link can view"'
    };
  }
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
    note: 'This is a mock assignment. In production, this would post to the real EnlightenAI API.'
  };
}

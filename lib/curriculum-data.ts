import { Course, Unit, Lesson, Resource, Rubric } from './types';

// Mock curriculum data for Grade 9 English I - Foundations of Literature
export const courses: Course[] = [
  {
    id: 'course-1',
    name: 'English I - Foundations of Literature',
    grade: '9'
  }
];

export const units: Unit[] = [
  {
    id: 'unit-1',
    courseId: 'course-1',
    number: 1,
    title: 'Foundations of Literature: Binti',
    objectives: [
      'Analyze how authors develop central ideas through literary elements',
      'Examine character development and transformation',
      'Explore themes of identity, belonging, and cultural heritage',
      'Practice close reading and textual analysis'
    ],
    standards: [
      'RL.9-10.2: Determine a theme or central idea of a text',
      'RL.9-10.3: Analyze how complex characters develop',
      'W.9-10.2: Write informative/explanatory texts',
      'SL.9-10.1: Initiate and participate in collaborative discussions'
    ]
  }
];

export const lessons: Lesson[] = [
  {
    id: 'lesson-1',
    unitId: 'unit-1',
    number: 1,
    title: 'Introduction to Binti and Cultural Identity'
  },
  {
    id: 'lesson-2',
    unitId: 'unit-1',
    number: 2,
    title: 'Character Analysis: Binti\'s Transformation'
  },
  {
    id: 'lesson-3',
    unitId: 'unit-1',
    number: 3,
    title: 'Theme Exploration: Belonging and Otherness'
  },
  {
    id: 'lesson-4',
    unitId: 'unit-1',
    number: 4,
    title: 'Performance Task: Literary Analysis Essay'
  }
];

export const resources: Resource[] = [
  {
    id: 'resource-1',
    lessonId: 'lesson-1',
    type: 'teacher_guide',
    title: 'Lesson 1 Teacher Guide',
    path: '/curriculum/grade-9/unit-1/lesson-1/teacher-guide.pdf',
    headings: [
      'Learning Objectives',
      'Materials Needed',
      'Lesson Overview',
      'Warm-Up Activity',
      'Mini-Lesson',
      'Guided Practice',
      'Independent Practice',
      'Closure and Assessment'
    ],
    metadata: {
      googleDocUrl:
        'https://docs.google.com/document/d/1vg7S6ZvWJhH_8fvzjg9_Knn_QEyOr-mFKwP7n9XHLOE/edit?usp=sharing',
      googleDocEmbedUrl:
        'https://docs.google.com/document/d/1vg7S6ZvWJhH_8fvzjg9_Knn_QEyOr-mFKwP7n9XHLOE/preview'
    },
    content: `# Lesson 1: Introduction to Binti and Cultural Identity

## Learning Objectives
- Students will be able to identify key elements of science fiction
- Students will analyze how Nnedi Okorafor introduces the protagonist Binti
- Students will explore themes of cultural identity and belonging

## Materials Needed
- Binti by Nnedi Okorafor (pages 1-20)
- Student handout: Character Analysis Chart
- Vocabulary list
- Exit ticket

## Lesson Overview (60 minutes)
This lesson introduces students to Nnedi Okorafor's novella Binti and establishes foundational understanding of the protagonist's cultural background and the science fiction genre.

## Warm-Up Activity (10 minutes)
**Quick Write Prompt**: Think about a time when you had to leave something familiar behind to pursue an opportunity. How did it feel? What did you bring with you to remind you of home?

Have students share with a partner, then invite 2-3 volunteers to share with the class.

## Mini-Lesson (15 minutes)
### Introduction to Science Fiction
Explain key characteristics of science fiction:
- Speculative elements (advanced technology, space travel, alien life)
- Grounded in scientific possibility
- Often explores social and philosophical questions

### Author Background
Introduce Nnedi Okorafor:
- Nigerian-American author
- Afrofuturism - blending African culture with science fiction
- Winner of Hugo and Nebula awards

### Cultural Context: The Himba People
Share background on the Himba people of Namibia:
- Semi-nomadic pastoralists
- Distinctive red ochre body covering (otjize)
- Strong cultural traditions and identity

## Guided Practice (20 minutes)
### Shared Reading (Pages 1-10)
Read aloud the opening pages together, pausing to:
- Identify unfamiliar vocabulary (otjize, astrolabe, currents, etc.)
- Note details about Binti's culture and family
- Highlight the conflict between tradition and opportunity

**Discussion Questions**:
1. What details does Okorafor use to establish Binti's cultural identity?
2. What is the central conflict Binti faces in these opening pages?
3. How does the author blend cultural traditions with futuristic elements?

### Character Analysis Chart
Model filling out the first section of the Character Analysis Chart:
- Physical description
- Cultural background
- Goals and motivations
- Initial conflicts

## Independent Practice (10 minutes)
Students continue reading pages 11-20 independently and complete their Character Analysis Charts.

**Sentence Frames for Support**:
- "Binti's cultural identity is shown through..."
- "One conflict she faces is..."
- "This is significant because..."

## Closure and Assessment (5 minutes)
**Exit Ticket**:
Answer the following in 3-5 sentences:
How does Binti's decision to leave home for Oomza University represent a conflict between personal ambition and cultural tradition? Use at least one specific detail from the text.

### Success Criteria:
- States Binti's decision and its significance
- Identifies the conflict between ambition and tradition
- Includes specific textual evidence
- Uses clear, complete sentences

## Differentiation
**For ELLs**:
- Provide vocabulary list with definitions and images
- Pair with stronger English speakers for discussion
- Offer sentence frames for all written responses

**For Advanced Learners**:
- Ask students to research another example of Afrofuturism
- Compare Binti's journey to the hero's journey archetype

## Homework
Read pages 21-35 and add 3 more entries to your Character Analysis Chart focusing on how Binti changes after leaving home.`
  },
  {
    id: 'resource-2',
    lessonId: 'lesson-1',
    type: 'student_handout',
    title: 'Character Analysis Chart',
    path: '/curriculum/grade-9/unit-1/lesson-1/character-analysis-chart.pdf',
    headings: ['Character Name', 'Physical Description', 'Cultural Background', 'Goals', 'Conflicts'],
    metadata: {
      googleDocUrl:
        'https://docs.google.com/document/d/1d9Tb1qv9wGr3fdejLBRZYK9uerg4Sa8dMoPv48qMGQQ/edit?usp=sharing',
      googleDocEmbedUrl:
        'https://docs.google.com/document/d/1d9Tb1qv9wGr3fdejLBRZYK9uerg4Sa8dMoPv48qMGQQ/preview'
    },
    content: `# Character Analysis Chart: Binti

## Character Name: _______________

### Physical Description
What does the character look like? Include details about appearance, dress, and any distinctive features.

---

### Cultural Background
What is the character's cultural heritage? What traditions or practices are important to them?

---

### Goals and Motivations
What does the character want? What drives their decisions and actions?

---

### Conflicts
What obstacles or challenges does the character face? (Internal and external)

---

### Key Quotes
Record important quotes that reveal character traits or development.

| Quote | Page | What It Reveals |
|-------|------|-----------------|
|       |      |                 |
|       |      |                 |
|       |      |                 |

### Character Development
How does the character change throughout the story?

Beginning: _______________________________________________

Middle: __________________________________________________

End: _____________________________________________________`
  },
  {
    id: 'resource-3',
    lessonId: 'lesson-2',
    type: 'teacher_guide',
    title: 'Lesson 2 Teacher Guide',
    path: '/curriculum/grade-9/unit-1/lesson-2/teacher-guide.pdf',
    headings: ['Learning Objectives', 'Materials', 'Lesson Activities', 'Assessment'],
    metadata: {
      googleDocUrl:
        'https://docs.google.com/document/d/1l6iMhPZt7x1YgnPZXoqBYwrs9jwELyhl725LLJoS5gM/edit?usp=sharing',
      googleDocEmbedUrl:
        'https://docs.google.com/document/d/1l6iMhPZt7x1YgnPZXoqBYwrs9jwELyhl725LLJoS5gM/preview'
    },
    content: `# Lesson 2: Character Analysis - Binti's Transformation

## Learning Objectives
- Analyze how Binti's character develops through key events
- Identify turning points in the narrative
- Examine the role of conflict in character transformation

## Materials Needed
- Binti (pages 21-50)
- Character transformation timeline handout
- Evidence collection worksheet

## Lesson Activities

### Do Now (5 minutes)
List three challenges Binti has faced so far in the story. Which challenge do you think will have the biggest impact on her?

### Discussion: Key Events (15 minutes)
Guide students through major events:
- Leaving home and family
- Journey on the Third Fish
- First encounters with other students
- The attack by the Meduse

### Guided Analysis (20 minutes)
Using a timeline, map Binti's emotional and psychological journey:
1. Departure - conflict and determination
2. Isolation - feeling like an outsider
3. Crisis - the Meduse attack
4. Transformation - becoming a bridge between cultures

**Analysis Questions**:
- How does trauma change Binti?
- What does she gain and what does she lose?
- How do her Himba traditions help her survive?

### Small Group Work (15 minutes)
In groups, students identify specific textual evidence for one aspect of Binti's transformation. Groups present findings to class.

### Exit Ticket (5 minutes)
Write a paragraph explaining one way Binti has changed from the beginning of the story. Include a quote as evidence.`
  },
  {
    id: 'resource-4',
    lessonId: 'lesson-4',
    type: 'assessment',
    title: 'Performance Task: Literary Analysis Essay',
    path: '/curriculum/grade-9/unit-1/lesson-4/performance-task.pdf',
    headings: ['Task Overview', 'Prompt', 'Requirements', 'Rubric'],
    metadata: {
      googleDocUrl:
        'https://docs.google.com/document/d/12VOsJh8h1k-VlHzkwmo7aX6ixSeKuuNHYsYAGdivEag/edit?usp=sharing',
      googleDocEmbedUrl:
        'https://docs.google.com/document/d/12VOsJh8h1k-VlHzkwmo7aX6ixSeKuuNHYsYAGdivEag/preview'
    },
    content: `# Performance Task: Literary Analysis Essay

## Task Overview
You will write a 2-3 page literary analysis essay examining how Nnedi Okorafor develops the theme of identity and belonging in Binti.

## Essay Prompt
In Binti, Nnedi Okorafor explores what it means to belong to multiple worlds and cultures. Write an essay in which you analyze how Okorafor develops the theme of identity and belonging through:
- Character development
- Cultural details and symbolism
- Key events and conflicts
- Resolution and transformation

Your essay should include:
- A clear thesis statement about how the theme is developed
- At least three body paragraphs with topic sentences
- Specific textual evidence (quotes) with page numbers
- Analysis that explains how the evidence supports your thesis
- A conclusion that synthesizes your argument

## Requirements
- Length: 2-3 pages, typed, double-spaced
- Format: MLA heading and citations
- Evidence: Minimum of 5 quotes from the text
- Due date: [To be determined]

## Writing Process
1. **Brainstorming** (Day 1): Review text, identify key passages related to identity and belonging
2. **Outlining** (Day 1-2): Organize ideas into thesis and supporting paragraphs
3. **Drafting** (Day 2-3): Write first draft with evidence and analysis
4. **Peer Review** (Day 4): Exchange papers with partner for feedback
5. **Revision** (Day 5): Revise based on feedback and rubric
6. **Final Draft** (Day 6): Submit polished essay

## Rubric

### Thesis and Focus (25 points)
- **Exemplary (23-25)**: Insightful, specific thesis that clearly addresses the prompt. Maintained consistent focus throughout.
- **Proficient (20-22)**: Clear thesis that addresses the prompt. Generally maintains focus.
- **Developing (15-19)**: Thesis is present but may be unclear or too broad. Some loss of focus.
- **Emerging (0-14)**: Thesis is missing, unclear, or doesn't address prompt.

### Evidence and Analysis (35 points)
- **Exemplary (32-35)**: Excellent use of multiple, well-chosen quotes. Deep analysis that explains how evidence supports thesis. Makes insightful connections.
- **Proficient (28-31)**: Good use of textual evidence. Solid analysis that connects evidence to thesis.
- **Developing (21-27)**: Some evidence included but may lack variety or relevance. Analysis is superficial or incomplete.
- **Emerging (0-20)**: Minimal evidence. Little to no analysis.

### Organization and Structure (20 points)
- **Exemplary (18-20)**: Logical organization with smooth transitions. Each paragraph has clear topic sentence and supports thesis.
- **Proficient (16-17)**: Generally well-organized. Most paragraphs have topic sentences.
- **Developing (12-15)**: Some organizational issues. Paragraphs may lack clear focus.
- **Emerging (0-11)**: Poor organization makes essay difficult to follow.

### Language and Conventions (20 points)
- **Exemplary (18-20)**: Sophisticated vocabulary and varied sentence structure. Few to no errors in grammar, spelling, or MLA format.
- **Proficient (16-17)**: Clear writing with appropriate vocabulary. Minor errors that don't interfere with meaning.
- **Developing (12-15)**: Basic vocabulary. Some errors in grammar or format.
- **Emerging (0-11)**: Frequent errors that interfere with understanding.

## Total: _____ / 100

## Teacher Feedback

Strengths:

Areas for Growth:

Next Steps:`
  }
];

export const rubrics: Rubric[] = [
  {
    id: 'rubric-1',
    courseId: 'course-1',
    name: 'Literary Analysis Essay Rubric',
    criteria: [
      {
        name: 'Thesis and Focus',
        description: 'Clear, arguable thesis that addresses the prompt and is maintained throughout',
        levels: [
          { score: 4, description: 'Insightful, specific thesis; excellent focus' },
          { score: 3, description: 'Clear thesis; good focus' },
          { score: 2, description: 'Thesis present but unclear; some focus issues' },
          { score: 1, description: 'Weak or missing thesis' }
        ]
      },
      {
        name: 'Evidence and Analysis',
        description: 'Effective use of textual evidence with thorough analysis',
        levels: [
          { score: 4, description: 'Excellent evidence with deep, insightful analysis' },
          { score: 3, description: 'Good evidence with solid analysis' },
          { score: 2, description: 'Some evidence with superficial analysis' },
          { score: 1, description: 'Minimal evidence or analysis' }
        ]
      },
      {
        name: 'Organization',
        description: 'Logical structure with effective transitions',
        levels: [
          { score: 4, description: 'Excellent organization and flow' },
          { score: 3, description: 'Generally well-organized' },
          { score: 2, description: 'Some organizational issues' },
          { score: 1, description: 'Poor organization' }
        ]
      },
      {
        name: 'Language and Conventions',
        description: 'Appropriate academic language with correct grammar and format',
        levels: [
          { score: 4, description: 'Sophisticated language; minimal errors' },
          { score: 3, description: 'Clear language; minor errors' },
          { score: 2, description: 'Basic language; some errors' },
          { score: 1, description: 'Frequent errors that interfere with meaning' }
        ]
      }
    ]
  }
];

// Helper functions
export function getCourseById(id: string) {
  return courses.find(c => c.id === id);
}

export function getUnitsByCourseId(courseId: string) {
  return units.filter(u => u.courseId === courseId);
}

export function getLessonsByUnitId(unitId: string) {
  return lessons.filter(l => l.unitId === unitId);
}

export function getResourcesByLessonId(lessonId: string) {
  return resources.filter(r => r.lessonId === lessonId);
}

export function searchResources(query: string): Resource[] {
  const lowerQuery = query.toLowerCase();
  return resources.filter(r =>
    r.title.toLowerCase().includes(lowerQuery) ||
    r.content.toLowerCase().includes(lowerQuery) ||
    r.headings.some(h => h.toLowerCase().includes(lowerQuery))
  );
}

export function getAllResources() {
  return resources;
}

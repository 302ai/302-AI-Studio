# Documentation Search System

## Overview

This document explains how to implement an efficient, reasoning-based documentation search system using two JSONL index files and a multi-stage search workflow. This approach minimizes token usage while maximizing search relevance through structured indexing and intelligent section-level reading.

The system supports multiple documentation collections within a project, each with its own index files. The search process begins with discovering all available documentation indexes, understanding what each collection contains, and then performing targeted searches across relevant collections.

## How to Implement This System

### For Skills That Include This Documentation

Skills that bundle indexed documentation should guide users to perform the search themselves using the multi-stage workflow described in this document. The skill's SKILL.md should include clear instructions on how to execute each stage of the search process.

**CRITICAL: Research-First Methodology**

Package skills should instruct users (Claude) to follow a research-first approach:

1. **When user requests an implementation:**
   - First, search the documentation to understand the package's recommended approach
   - Understand patterns, configuration, and best practices
   - Then implement based on that research

2. **Why this matters:**
   - Package documentation represents authoritative guidance
   - Prevents implementing anti-patterns or deprecated approaches
   - Results in solutions that align with package design philosophy
   - Users get better, more maintainable code

3. **Workflow to teach:**
   - User: "Help me [accomplish task] with {package}"
   - Claude: Search documentation → Understand approach → Implement solution

**Do NOT assume:**
- Access to a specialized search agent
- External search infrastructure
- Automated search functionality

**Instead, teach users to:**
1. Follow research-first methodology (research before implementing)
2. Discover indexes using `find` command and Read tool
3. Load index.jsonl files into context with Read tool
4. Reason about which files are relevant
5. Read sections.jsonl entries for candidates
6. Read targeted sections from documentation files
7. Synthesize answers from multiple sources
8. Then implement based on researched knowledge

### Implementation in Package SKILL.md

When creating a package skill, the SKILL.md should include both a research-first methodology section and a searching documentation section:

```markdown
## How to Use This Skill

**IMPORTANT: Research-First Methodology**

When a user asks you to accomplish something with {package-name}:

1. **Research first** - Search the documentation to understand:
   - How {package-name} handles this use case
   - What the recommended approach is
   - What configuration or setup is needed
   - Common patterns and best practices

2. **Then execute** - Implement the solution using the knowledge gained from documentation

**Why this matters:**
- {Package-name} may have specific conventions or best practices
- The documentation provides authoritative guidance
- Researching first prevents mistakes and rework
- You'll implement solutions that align with package design

**Workflow:**
1. User requests: "Help me [accomplish task] with {package-name}"
2. You search documentation using the process below
3. You understand the recommended approach
4. You implement the solution correctly the first time

### Searching Documentation

This skill includes indexed documentation that you can search efficiently using a multi-stage process:

**Stage 0: Discover what documentation exists**

Find all documentation indexes:
```bash
find . -name "index.jsonl" -type f
```

For each index found, read 3-5 sample entries to understand the collection:
```
Read docs/index.jsonl with offset: 1, limit: 5
Read references/index.jsonl with offset: 1, limit: 5
```

Determine which collections are relevant to your query.

**Stage 1: Load relevant indexes**

Read the complete index.jsonl file(s) for relevant collection(s):
```
Read docs/index.jsonl
Read references/index.jsonl
```

**Stage 2: Reason about candidates**

Analyze all summaries to identify 3-4 most relevant files across collections:
- Consider query intent (how-to, what-is, reference lookup, troubleshooting)
- Evaluate topic hierarchy and specificity
- Consider collection authority (project docs vs vendor docs)
- Think about related concepts and prerequisites

**Stage 3: Get section details**

For your 3-4 candidates, read their sections.jsonl entries:
```
Read docs/sections.jsonl with offset: {index}, limit: 1
Read references/sections.jsonl with offset: {index}, limit: 1
```

Note: Index number from docs/index.jsonl maps to line number in docs/sections.jsonl

**Stage 4: Read targeted sections**

Read only the relevant sections from documentation files:
```
Read docs/authentication/overview.md with offset: 45, limit: 89
Read references/getting-started.md with offset: 18, limit: 62
```

**Stage 5: Synthesize and answer**

Combine information from multiple sources and provide:
- Direct answer to the question
- Code examples or implementation details
- Related concepts or prerequisites
- File references for further reading

For complete search methodology, see the bundled documentation-search-system.md file.
```

This ensures users can effectively search the documentation without requiring external agents or infrastructure.

## System Components

### 1. Index Files

The search system relies on two synchronized JSONL (JSON Lines) files:

#### index.jsonl - Quick Lookup Index
Each line contains a terse summary for fast scanning:
```json
{"index": N, "relative_path": "path/to/file.md", "summary": "Terse, keyword-rich summary"}
```

**Purpose:**
- Enable fast scanning of all documentation
- Provide keyword-rich summaries for reasoning
- Small file size (~20KB for 100 docs) allows loading entire index into context

**Summary characteristics:**
- 150-250 characters
- Information-dense with specific keywords
- Captures primary purpose and key topics
- Avoids generic phrases ("this document explains...")

#### sections.jsonl - Detailed Breakdown Index
Each line contains comprehensive file metadata with section-level details:
```json
{
  "index": N,
  "relative_path": "path/to/file.md",
  "detailed_summary": "Comprehensive 2-4 sentence description of file purpose, use case, audience, and key topics",
  "sections": [
    {
      "heading": "Section Title",
      "level": 2,
      "offset": 42,
      "limit": 58,
      "summary": "What this section covers"
    }
  ]
}
```

**Purpose:**
- Provide detailed context for selected candidates
- Enable section-level reading of documentation
- Include line numbers (offset/limit) for precise file access

**Section metadata:**
- `heading`: Header text without the leading `#`
- `level`: Heading level (2 by default, optionally 3 when `heading_depth` is 3)
- `offset`: Line number where section starts (1-indexed)
- `limit`: Number of lines from offset to the next indexed heading or end of file
- `summary`: Specific description of what this section teaches/explains

### 2. Synchronization Requirements

**Critical invariants:**
- Both files must have identical number of lines
- Entry with `"index": N` in index.jsonl corresponds to line N in sections.jsonl
- Both entries share identical `index` and `relative_path` values
- This 1:1 mapping enables efficient cross-referencing

### 3. Multiple Documentation Collections

**Project structure:**
A project may have multiple documentation folders, each with its own index files:

```
project-root/
├── docs/                    # Main project documentation
│   ├── index.jsonl
│   └── sections.jsonl
├── api-docs/                # API reference documentation
│   ├── index.jsonl
│   └── sections.jsonl
├── vendor/package/docs/     # Third-party package docs
│   ├── index.jsonl
│   └── sections.jsonl
└── tutorials/               # Tutorial collection
    ├── index.jsonl
    └── sections.jsonl
```

**Discovery requirement:**
The search system must discover all documentation collections before executing a search. This is accomplished through Stage 0: Index Discovery.

## The Multi-Stage Search Workflow

The complete search workflow consists of 5 stages, beginning with discovering what documentation is available.

### Stage 0: Index Discovery

**Action:** Discover all documentation collections in the project

**Purpose:**
- Find all folders containing `index.jsonl` and `sections.jsonl` files
- Understand what each documentation collection covers
- Determine which collections are relevant to the search query

**Discovery process:**

1. **Find index files from project root:**
   ```bash
   find . -name "index.jsonl" -type f
   ```

2. **For each discovered index, read first 3-5 entries:**
   ```
   Read {path}/index.jsonl with offset: 1, limit: 5
   ```

3. **Analyze collection characteristics:**
   - What topics does this collection cover?
   - What is the scope (API docs, guides, tutorials, etc.)?
   - Is it relevant to the current query?

**Example discovery analysis:**

```
Query: "How do I authenticate API requests?"

Discovery results:
- ./docs/index.jsonl (5 entries scanned)
  Topic: General project documentation
  Scope: Getting started, concepts, deployment
  Relevance: LOW (focuses on deployment, not API usage)

- ./api-docs/index.jsonl (5 entries scanned)
  Topic: REST API reference and authentication
  Scope: Endpoints, authentication methods, request/response formats
  Relevance: HIGH (primary API documentation)

- ./vendor/oauth-lib/docs/index.jsonl (5 entries scanned)
  Topic: OAuth library implementation details
  Scope: OAuth flows, token management, integration guide
  Relevance: HIGH (authentication implementation)

- ./tutorials/index.jsonl (5 entries scanned)
  Topic: Step-by-step tutorials
  Scope: Basic usage examples, common scenarios
  Relevance: MEDIUM (may have auth examples)

Selection: Search api-docs/ and vendor/oauth-lib/docs/ first
```

**Benefits:**
- Avoids loading irrelevant documentation
- Provides context about what documentation exists
- Enables cross-collection reasoning
- User receives more targeted answers

**Collection metadata to note:**
- Collection path (for constructing file paths)
- Topic focus (API, guides, tutorials, reference)
- Apparent scope (from sampled summaries)
- Relevance to query (high/medium/low)

### Stage 1: Load Complete Indexes

**Action:** Read the entire `index.jsonl` file into context for each relevant collection

**Important:** After Stage 0 discovery, you may have identified 2-3 relevant collections. Load the complete index for each of these collections.

**Rationale:**
- Small file size makes complete loading efficient
- Provides all file summaries for reasoning within each collection
- Enables comprehensive analysis of documentation structure
- Multiple collections can be loaded (typically 2-3 relevant ones)

**What you obtain:**
- Every documentation file's path and summary within each collection
- Index numbers for cross-referencing within each collection
- Keywords and topics across each documentation set
- Understanding of collection boundaries

**What to analyze:**
- Keywords matching the search query across all loaded collections
- Related concepts and technologies
- File path structure indicating topic areas (e.g., `getting-started/`, `guides/`, `reference/`)
- Which collection likely has the most authoritative information

**Multi-collection considerations:**
- Each collection has independent indexing (index numbers are per-collection)
- Track which index belongs to which collection path
- Consider collection scope when prioritizing candidates
- Main project docs vs vendor/third-party docs vs specialized collections

### Stage 2: Reason About Candidates

**Action:** Use human-like reasoning to identify 3-4 most relevant files across all loaded collections

**Key principle:** Reasoning > keyword matching

**Reasoning considerations:**

1. **Query Intent Analysis**
   - "How to" → Implementation guides
   - "What is" → Conceptual explanations
   - "Why" → Troubleshooting or architecture
   - "When" → Lifecycle or workflow documentation

2. **Topic Hierarchy**
   - Getting started vs advanced guides
   - General overviews vs specific references
   - Prerequisites vs main content

3. **Specificity Level**
   - Comprehensive guides vs quick references
   - Examples vs explanations
   - API reference vs usage tutorials

4. **Related Concepts**
   - Direct topic mentions
   - Prerequisite knowledge
   - Related functionality

5. **Collection Authority**
   - Primary project docs vs vendor docs
   - Official API docs vs community tutorials
   - Which collection is authoritative for this topic?
   - Consider collection scope from Stage 0

**Anti-patterns to avoid:**
- Simple keyword grep matching
- Selecting files based solely on filename
- Reading all files that mention the topic
- Skipping reasoning and jumping to file reading

### Stage 3: Get Section Details for Candidates

**Action:** Read specific entries from `sections.jsonl` for your 3-4 candidates across collections

**Key insight:** The index number maps directly to line number within each collection
- Entry with `"index": 38` in docs/index.jsonl → line 38 in docs/sections.jsonl
- Entry with `"index": 8` in vendor/oauth-lib/docs/index.jsonl → line 8 in vendor/oauth-lib/docs/sections.jsonl
- Use Read tool with offset parameter: `Read {collection_path}/sections.jsonl with offset: N, limit: 1`

**Important:** Each collection has its own independent indexing system. Always use the correct collection path when reading sections.

**What you obtain:**
- Detailed summary (2-4 sentences) of file purpose
- Array of H2 sections with:
  - Section titles
  - Line numbers (offset/limit)
  - Section-specific summaries

**Analysis to perform:**
- Which sections directly address the query?
- Are prerequisite sections needed for context?
- Are there related sections providing additional value?

### Stage 4: Read Targeted Sections

**Action:** Read only relevant sections from actual documentation files across collections

**Precision reading strategy:**
```
Read {collection_path}/{relative_path} with offset: X, limit: Y
```

**Cross-collection reading example:**
```
# From api-docs collection
Read api-docs/authentication/overview.md with offset: 45, limit: 89

# From vendor library collection
Read vendor/oauth-lib/docs/guides/getting-started.md with offset: 18, limit: 62

# From main docs collection
Read docs/getting-started/quickstart.md with offset: 120, limit: 35
```

**Benefits:**
- Only read what you need (not entire files)
- Stay within token limits
- Faster response times
- More focused answers

**Reading strategies by query type:**

1. **Comprehensive understanding needed**
   - Read primary sections from 2-3 files
   - Include prerequisite context if needed

2. **Quick answer needed**
   - Read single most relevant section
   - Provide file references for deeper exploration

3. **Example + explanation needed**
   - Read guide section explaining concept
   - Read example section demonstrating implementation

### Stage 5: Synthesize and Answer

**Action:** Provide comprehensive answer with file references across collections

**Answer structure:**

1. **Direct answer** to the user's question
2. **Code examples** or specific implementation details (prioritize project-specific docs)
3. **Related concepts** or prerequisites
4. **File references** for further reading with collection context

**File reference format (single collection):**
```
See: guides/validation.md:18-129 (Phase 1: Submission Validation)
See: guides/forms.md:177-253 (Validation Hooks)
```

**File reference format (multiple collections):**
```
See: api-docs/authentication/overview.md:45-134 (OAuth Flow Overview)
See: vendor/oauth-lib/docs/guides/getting-started.md:18-80 (OAuth Library Integration)
See: docs/getting-started/quickstart.md:120-155 (Authentication Example)
```

**Cross-collection synthesis:**
When answering from multiple collections:
1. Lead with project-specific documentation (main docs, api-docs)
2. Supplement with vendor/library documentation where needed
3. Make clear which source each piece of information comes from
4. Highlight if vendor docs provide deeper implementation details
5. Note any conflicts or inconsistencies between collections

## Summary

This documentation search system achieves efficient, relevant search results through:

1. **Index discovery** to find and understand all available documentation collections
2. **Structured indexing** with two synchronized JSONL files per collection
3. **Reasoning-based candidate selection** instead of keyword matching
4. **Section-level precision reading** to minimize token usage
5. **Multi-stage workflow** that balances efficiency and accuracy across collections

The key insights are:
- Discovering what documentation exists prevents wasted effort
- Sampling indexes reveals collection scope and relevance
- Loading small indexes enables intelligent reasoning about what to read
- Multiple collections can be searched efficiently by being selective
- Section-level reading is far more efficient than reading entire files

By implementing this system, projects gain:
- Fast documentation search across multiple collections
- Token-efficient operations even with extensive documentation
- High-quality, relevant results from authoritative sources
- Scalability to large documentation sets with multiple collections
- Support for multi-query sessions with intelligent caching
- Clear attribution of information to specific documentation sources

The system is particularly effective because it mirrors how humans search documentation across multiple sources: discover what's available, scan indexes, identify relevant sections across sources, read those specific sections, synthesize a comprehensive answer.

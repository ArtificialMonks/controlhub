# Document Title

Brief description of the document's purpose and scope. Keep this introduction concise and under 120 characters per
line.

## Overview

Provide a high-level overview of the content. This section should give readers a clear understanding of what they can
expect to find in this document.

### Subsection Example

Use subsections to organize content logically. Ensure each section has a clear purpose and flows naturally from the
previous section.

## Main Content Sections

### Code Examples

When including code examples, always specify the language for proper syntax highlighting:

```typescript
// Example TypeScript code
interface ExampleInterface {
  property: string;
  method(): void;
}

```text

```bash

## Example shell commands

npm install
npm run build

```text

### Lists and Formatting

Use consistent formatting for lists:

- **Bold text** for important terms and concepts
- _Italic text_ for emphasis
- `Code snippets` for inline code references
- Line length must not exceed 120 characters

#### Numbered Lists

1. First item with clear, concise description
2. Second item following the same pattern
3. Third item maintaining consistency

### Tables

Use tables for structured data with proper alignment:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |
| Data A   | Data B   | Data C   |

### Links and References

- [External link example](https://example.com) for web resources
- [Internal link example](./other-document.md) for project documentation
- Use descriptive link text, not generic phrases like "click here"

## Quality Standards

### Line Length

- Maximum 120 characters per line
- Break long sentences naturally at logical points
- Use line breaks to improve readability

### Headings

- Start with level 1 heading (`#`) for document title
- Use proper heading hierarchy (don't skip levels)
- Add blank lines before and after all headings

### Spell Check

- Add technical terms to `.cspell.json` when needed
- Verify all terminology is spelled correctly
- Use consistent capitalization throughout the document

## Common Patterns

### Problem and Solution

**Problem:** Describe the issue or challenge clearly and concisely.

**Solution:** Provide the resolution or approach, with step-by-step instructions when applicable.

### Configuration Examples

```json
{
  "setting": "value",
  "array": [

```text

"item1",
"item2"

```text

  ]
}

```text

### Command Line Instructions

```bash

## Install dependencies

npm install

## Run development server

npm run dev

## Build for production

npm run build

```text

## Conclusion

Summarize the key points covered in the document. Provide next steps or additional resources when relevant.

---

**Note:** This template follows the project's markdown quality standards as defined in `docs/MARKDOWN_LINTING.md`.
Always validate your markdown using `npm run lint:md` before committing.

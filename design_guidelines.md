# Design Guidelines: Epistemic Reasoning Application

## Design Approach
**System Selected:** Material Design / Academic Research Tool Pattern  
**Rationale:** This is a utility-focused, information-dense application for philosophical and scientific text analysis. Prioritizing clarity, readability, and functional efficiency over visual flourish. Draw inspiration from research tools like Overleaf, Notion (editor view), and academic database interfaces.

**Core Principles:**
- Maximum readability for long-form philosophical text
- Clear visual hierarchy for multi-layered analysis output
- Efficient input-to-output workflow
- Professional, scholarly aesthetic
- Minimal distractions; focus on content

---

## Typography

**Font Stack:**
- **Primary:** Inter (Google Fonts) - body text, UI elements
- **Monospace:** JetBrains Mono - code snippets, technical notation
- **Serif (Optional):** Merriweather - extended reading sections if needed

**Hierarchy:**
- **Main headings:** text-2xl font-semibold (module titles)
- **Section headings:** text-lg font-medium (layer labels, output sections)
- **Body text:** text-base leading-relaxed (input/output content)
- **Labels/metadata:** text-sm text-gray-600 (scores, tags, timestamps)
- **Technical notation:** text-sm font-mono (premises, logical structures)

---

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16 for consistent rhythm  
(e.g., p-4, mb-6, gap-8, py-12, space-y-16)

**Container Strategy:**
- **Full application:** max-w-7xl mx-auto px-6
- **Text input/output areas:** max-w-4xl for optimal reading width
- **Analysis panels:** Full width within container to accommodate side-by-side comparisons

**Layout Patterns:**
- **Header:** Fixed top bar with module selector, word count, status indicators
- **Main workspace:** Two-column layout where appropriate (input | output) collapsing to single column on mobile
- **Results display:** Stacked sections with clear visual separation (cards with subtle borders)

---

## Component Library

### Core Components

**Text Input Area:**
- Large textarea with character count (0/2000 words)
- Subtle border, generous padding (p-6)
- Line-height optimized for readability
- Auto-save indicator

**Module Selector:**
- Tab-style navigation or segmented control
- Three modules: Epistemic Inference | Justification Builder | Knowledge Mapper
- Active state clearly indicated

**Analysis Output Cards:**
- White/light background cards with rounded corners (rounded-lg)
- Each layer gets its own card: Analysis → Judgment → Rewrite
- Clear section headers with collapse/expand functionality
- Coherence scores displayed prominently with visual indicator (progress bar or radial chart)

**Argument Segments:**
- When multiple arguments detected, display as numbered segments
- Each segment contains its own 3-layer analysis
- Visual nesting to show sub-arguments

**Results Presentation:**
- **Analysis Layer:** Bullet lists with proper indentation for premises/conclusions
- **Judgment Layer:** Score visualization (0-1 scale) + qualitative assessment text
- **Rewrite Layer:** Full-width text block with serif option for readability

### Navigation & Controls

**Primary Actions:**
- Large "Analyze" button (primary action color)
- Secondary actions: Clear, Export, Save (ghost/outline style)
- Module switching via top navigation

**Status Indicators:**
- Processing state with subtle loading animation
- Error states for overlength or non-argumentative text
- Success confirmation

---

## Interaction Patterns

**Workflow:**
1. User selects module → inputs text → clicks analyze
2. System shows processing state → displays segmented analysis
3. User can expand/collapse sections, export results, or run new analysis

**Feedback:**
- Real-time word count during input
- Validation messages (overlength warning at 1800 words)
- Clear error states with diagnostic messages ("No inferential content detected")

**Responsive Behavior:**
- Desktop: Two-column layout (input left, output right) OR single column with tabbed view
- Tablet/Mobile: Single column, collapsible sections

---

## Visual Hierarchy

**Priority Levels:**
1. **Primary:** Text input area and "Analyze" button
2. **Secondary:** Analysis output with coherence scores
3. **Tertiary:** Module metadata, timestamps, export options

**Visual Weight:**
- Use card elevation sparingly (only for active/focused elements)
- Subtle shadows (shadow-sm) for cards
- Clear borders (border-gray-200) to separate sections
- Ample whitespace between analysis layers

---

## Accessibility & Polish

- High contrast text (gray-900 on white, not pure black)
- Focus states on all interactive elements
- Keyboard navigation for module switching
- ARIA labels for screen readers on analysis components
- Maintain 16px minimum for body text

---

## Icons

**Library:** Heroicons (outline style via CDN)  
**Usage:**
- Module icons (document-text, wrench, map)
- Status icons (check-circle, exclamation-triangle)
- Action icons (download, clipboard, refresh)
- Expand/collapse chevrons

---

## Images

**No hero images required.** This is a functional tool, not a marketing site. Focus on clean UI and data visualization.

If branding is needed: Small logo/wordmark in top-left corner only.

---

## Summary

This design prioritizes **functional clarity over visual spectacle**. The interface should feel like a professional research tool—clean, organized, and focused on delivering complex analytical insights in a digestible format. Typography and spacing do the heavy lifting; decorative elements are minimal.
## ADDED Requirements

### Requirement: Authored static description is separate from the visible subtitle

An authored static SVG SHALL expose the selected title as its accessible name
and an editor-authored description, when present, as its accessible description.
Without a selected description, the visible subtitle MAY remain the rendering
fallback but SHALL NOT alone establish accessibility acceptance for a complex
figure. The Edition editor owns the alternative's semantic adequacy; Publisher
SHALL escape and bind the selected text without inferring source meaning.

#### Scenario: A detailed source-owned static figure is published

- **WHEN** its Edition selects a distinct description of the causal relations and limits
- **THEN** the SVG exposes that text through `aria-describedby` separately from its title
- **AND** qualification still judges the exact artifact and does not infer accessible completeness from field presence

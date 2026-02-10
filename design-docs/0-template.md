# [Title]: Brief Descriptive Name

| Field | Value |
|-------|-------|
| **Author(s)** | [Your Name] |
| **Status** | Draft / In Review / Approved / Implemented / Superseded |
| **Created** | YYYY-MM-DD |
| **Last Updated** | YYYY-MM-DD |
| **Reviewers** | [Names of required reviewers] |
| **Approvers** | [Names of decision makers] |

---

## Summary

<!--
A 2-3 sentence executive summary of the proposal. This should be concise enough
that a reader can understand the core idea without reading the full document.
-->

## Context and Background

<!--
Briefly set the stage. What is the current state? What led to this proposal?
Keep this section focused - a few paragraphs, not pages of history.
Include links to related documents (PRDs, previous ADRs, etc.) rather than
duplicating information.
-->

## Goals

<!--
List the specific objectives this design aims to achieve.
Be concrete and measurable where possible.
-->

- Goal 1: [Description]
- Goal 2: [Description]

## Non-Goals

<!--
Explicitly state what is OUT of scope. This prevents scope creep and sets
clear boundaries. What might readers assume is included that actually isn't?
-->

- Non-goal 1: [Description]
- Non-goal 2: [Description]

## Proposed Design

<!--
The core of your document. Describe your solution in detail.
Include:
- Architecture overview
- Component descriptions
- Data models and schemas
- API specifications (if applicable)
- Key algorithms or logic

Use diagrams liberally - a picture is worth a thousand words.
-->

### Architecture Overview

[Describe the high-level architecture. Include a diagram if helpful.]

### Component Design

[Detail each major component, its responsibilities, and interfaces.]

### Data Model

[Describe data structures, schemas, and storage considerations.]

### API Design

<!--
If applicable, document the API surface.
-->

```
[API examples or specifications]
```

## Trade-offs and Alternatives Considered

<!--
This section has long-term value as organizational memory.
Document what options you evaluated and why you chose this approach.
-->

### Option 1: [Name]

**Description:** [Brief description]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Why not chosen:** [Explanation]

### Option 2: [Name]

[Same structure as above]

### Chosen Approach Rationale

[Summarize why the proposed design was selected over alternatives]

## Cross-Cutting Concerns

### Scalability

<!--
How will this design scale? Consider: traffic growth, data volume,
multi-region deployment, horizontal vs vertical scaling.
-->

### Security

<!--
What are the security implications? Consider:
- Authentication/Authorization
- Data encryption (at rest and in transit)
- Input validation
- Threat model considerations
-->

### Privacy and Compliance

<!--
Address data protection requirements as applicable:
- GDPR, CCPA, HIPAA considerations
- Data residency requirements
- Audit logging needs
-->

### Observability

<!--
How will you know if this is working correctly?
- Metrics to track
- Logging strategy
- Alerting thresholds
- Dashboards needed
-->

### Performance

<!--
What are the performance requirements and how will they be met?
- Latency targets
- Throughput requirements
- Resource utilization expectations
-->

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |
| [Risk 2] | Low/Medium/High | Low/Medium/High | [Mitigation strategy] |

## Dependencies

<!--
What does this design depend on? What depends on this?
Include both technical dependencies and team/organizational dependencies.
-->

- [Dependency 1]: [Description and status]
- [Dependency 2]: [Description and status]

## Rollout Plan

<!--
How will this be deployed? Consider:
- Phased rollout strategy
- Feature flags
- Rollback plan
- Migration steps (if applicable)
-->

### Phase 1: [Name]
[Description]

### Phase 2: [Name]
[Description]

### Rollback Strategy

[How to revert if issues arise]

## Test Plan

<!--
How will you validate the design works correctly?
- Unit testing approach
- Integration testing
- Load/Performance testing
- User acceptance criteria
-->

## Open Questions

<!--
List unresolved questions that need input from reviewers or further investigation.
Remove or resolve these before the document is approved.
-->

- [ ] Question 1: [Description]
- [ ] Question 2: [Description]

## Appendix

<!--
Optional section for supplementary material:
- Detailed calculations
- Extended examples
- Reference materials
- Glossary of terms
-->

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| YYYY-MM-DD | [Name] | Initial draft |

---

<!--
## Usage Notes for This Template

### When to Write a Design Doc
- Any project requiring ~1 month or more of work
- Changes that affect multiple teams or systems
- Architectural decisions with long-term implications
- Work requiring cross-functional review (security, ops, etc.)

### Best Practices
1. **Write early**: Start before implementation to think through problems
2. **Iterate**: Gather feedback and refine before finalizing
3. **Be concise**: As short as possible, as long as necessary
4. **Use diagrams**: Visualize architecture and data flows
5. **Document rationale**: The "why" is as important as the "what"
6. **Keep it updated**: Treat as a living document during development

### Review Process
1. Share draft with key stakeholders for initial feedback
2. Address comments and iterate on the document
3. Schedule formal review meeting if needed
4. Obtain required approvals before implementation
5. Update document as implementation reveals new information

### Naming Convention
Use sequential numbering: 1-feature-name.md, 2-another-feature.md

### Related Document Types
- **PRD (Product Requirements Doc)**: Defines "what" and "why" from product perspective
- **ADR (Architecture Decision Record)**: Captures individual decisions during/after implementation
- **RFC (Request for Comments)**: Formal proposal seeking peer feedback (this template serves as RFC)
- **BRD (Business Requirements Doc)**: High-level business needs and objectives

### After Approval
- Create ADRs for significant decisions made during implementation
- Update this document if the design changes materially
- Link related code PRs back to this document
-->

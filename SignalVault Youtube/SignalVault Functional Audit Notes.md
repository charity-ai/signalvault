# SignalVault Functional Audit Notes

## Audit pass 1: Ask and Library

- The **Ask** workspace renders a polished source-grounded answer, an evidence rail, selectable citations, a question field, and suggested question chips. It correctly communicates the intended evidence-first positioning.
- Current core limitation: answers are fixed demonstration content. Submitting an arbitrary question changes the displayed question, but does not change the underlying answer or evidence based on actual retrieval. The Copy Answer control only changes its UI label and does not copy to the clipboard.
- The **Library** workspace renders a count, duration, searchable source cards, format filters, episode detail, and chapter controls.
- The card selection and format/search filtering are functional. Current core limitations: all counts are demonstration data; sort, source-chapter play, and “Ask about this episode” do not execute their implied production behavior.
- Commercial implication: the interface has high perceived value, but monetization must wait until the core outcome, live source ingestion plus answer retrieval, is real. Paid pilots may still be viable if concierge-assisted and explicitly described as beta.

## Audit pass 2: Library filtering and episode selection

Library text search correctly narrows the visible source list. Searching “lead” returned the Lead Response short. Selecting that source updated the episode-detail card with the correct title, category, duration, summary, and chapter count. This demonstrates a working interaction model for the future indexed video library.

The episode chapter list remains fixed placeholder content even when the selected video changes. The “Ask about this episode” action also does not currently route a scoped source question into Ask. In production, both must rely on the selected episode’s actual timestamped transcript chunks. These are not cosmetic refinements. They are essential to the customer promise of episode-level source accuracy.

## Audit pass 3: Topics

The Topic workspace communicates a differentiated product concept: authority concentration, an interconnected topic map, topic growth signals, and a white-space content prompt. Selecting a topic successfully transfers a contextual question into Ask.

The handoff currently changes the question but not the fixed answer or evidence set. The topic map, source-mention counts, growth figures, date selector, and white-space recommendation are all presentation-level demonstration data. This workspace should become the premium “content strategy engine” after real ingestion. It should not be monetized as analytics until topic clustering, source counts, gaps, and recommended content are truly computed from channel data.

## Audit pass 4: Reference

The Reference workspace is strategically well designed. It makes the correct distinction between public metadata, conditional public text evidence, and protected private transcript access. This distinction is a product-strength and compliance safeguard rather than a limitation.

The public-channel input rejects arbitrary text by disabling analysis until a valid YouTube URL or handle is supplied. A valid input produces a clearly labeled sample report. There is no actual public-channel request, persistent reference board, competitive comparison, pricing gate, or source import in the current prototype. This tab is the strongest top-of-funnel monetization candidate once it can return a genuinely useful free report that leads to a paid Vault or agency service.

## Audit pass 5: Opportunities

The Opportunities workspace expresses the correct business model. It reframes the content archive as a source of paid diagnostics, proof assets, and sales-enablement tools. The content-to-revenue map is especially aligned with a premium AI consulting audience.

Actions such as “Create audit outline,” “Draft video brief,” and “Generate asset” currently route only to Ask. They do not create an artifact, attach citations, save a draft, or make a product/CRM handoff. This is the single highest-value workspace for Agency and Enterprise monetization, but it needs source-backed generation, export, and integration outcomes before it justifies premium recurring pricing.

## Audit pass 6: Source intake and settings

The Add Source control opens a clear modal that correctly states the production boundary: owner-authorized captions or creator-provided transcripts. This is appropriate product messaging for a private RAG platform. The modal accepts a channel URL and stages a success state, but it does not validate the source, create a persistent record, request authorization, upload a transcript, or start indexing.

The Settings item is visible but has no destination or action. For a private beta, source consent, data deletion, source refresh, workspace access, billing, and usage controls must be real Settings capabilities before external users are invited. The global “Add source” intake and Settings blank state are the highest-priority trust and operability gaps after live ingestion and retrieval.

The source-intake modal’s staged confirmation and close action work as designed for a demonstration. It remains non-persistent by design and therefore cannot serve as a production onboarding flow.

The Settings control was tested and has no current action. This confirms it is a nonfunctional UI element rather than a missing data condition.

# SignalVault Feature Tracker

## Completed

- [x] Responsive private intelligence prototype with Ask, Library, Topics, Reference, and Opportunities workspaces.
- [x] Public Reference URL and handle validation.
- [x] Public metadata ingestion contract with a 30-day retention policy.
- [x] Retrieval-ready chunking for channel and video metadata without copying media or assuming captions.
- [x] Database model for reference channels, recent videos, retrieval chunks, expiration, and saved boards.

## In Progress

- [ ] Connect Reference screen to the live channel ingestion router and metadata query results.
- [ ] Generate and apply the Reference ingestion database migration.
- [ ] Validate end-to-end public metadata scan with a real YouTube channel.

## Next Product Milestones

- [ ] Add a managed vector provider adapter for embeddings once a Qdrant or Pinecone account is selected.
- [ ] Add authenticated owner-channel intake and permissioned caption or transcript ingestion.
- [ ] Add background refresh jobs, expiry cleanup, source deletion receipts, and retention controls.
- [ ] Add workspace isolation, billing entitlements, and Agency client workspaces.

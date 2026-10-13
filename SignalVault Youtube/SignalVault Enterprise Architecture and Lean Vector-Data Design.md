# SignalVault Enterprise Architecture and Lean Vector-Data Design

**Prepared for:** Charity  
**Prepared by:** Manus AI  
**Date:** September 5, 2026

## Direct Answer

**SignalVault should not store YouTube video files, copied audio, or a permanent mirror of every channel in a vector database.** It should retain only what is needed to answer an approved business question with a verifiable citation.

The recommended data boundary is simple:

> **The relational database is the system of record. Object storage retains only optional, permissioned evidence. The vector database retains embeddings and minimal retrieval metadata. YouTube remains the primary media host.**

A creator, channel, brand, workspace, authorization record, billing relationship, and source policy belong in the relational database. Video files never belong in SignalVault storage. A transcript or caption excerpt is only retained when the creator authorized the Vault to index it or supplied it directly. The vector database stores a numeric representation of approved text, a stable citation ID, and filters that guarantee retrieval stays within the active workspace.

![SignalVault enterprise architecture](https://private-us-east-1.manuscdn.com/sessionFile/54PN7RrjKCqKu25NPLAK5z/sandbox/IVAwM3QkFrUwU4HgYxkCNv-images_1788617938397_na1fn_L2hvbWUvdWJ1bnR1L3lvdXR1YmUtY2hhbm5lbC1pbnRlbGxpZ2VuY2Uvc2lnbmFsdmF1bHQtZW50ZXJwcmlzZS1hcmNoaXRlY3R1cmU.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNTRQTjdScmpLQ3FLdTI1TlBMQUs1ei9zYW5kYm94L0lWQXdNM1FrRnJVd1U0SGdZeGtDTnYtaW1hZ2VzXzE3ODg2MTc5MzgzOTdfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzbHZkWFIxWW1VdFkyaGhibTVsYkMxcGJuUmxiR3hwWjJWdVkyVXZjMmxuYm1Gc2RtRjFiSFF0Wlc1MFpYSndjbWx6WlMxaGNtTm9hWFJsWTNSMWNtVS5wbmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTA4MTI4MDB9fX1dfQ__&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEQCIDxk5a8a3~73TOtjrjMaKQdXbl8VuPHrUJD6zdJWEKgjAiAdLarXRXzoRxWwhcLJVRbI9tSDP3QqeSZPe-D-ihHyyg__)

## What the Vector Database Keeps

A **vector** is a numeric representation of the meaning of a short text passage. It lets SignalVault find passages that are semantically relevant to a question even when the wording differs. The vector is not a video file and should not include raw video, audio, thumbnails, user credentials, or customer contact records.

### Default vector record

| Field | Stored in vector database? | Purpose | Example |
|---|---|---|---|
| `vector_id` | Yes | Stable pointer to the source chunk. | `chunk_01J...` |
| `embedding` | Yes | Numeric semantic representation used for similarity search. | 1,536 or 3,072 floating-point values, depending on the embedding model. |
| `workspace_id` | Yes, mandatory filter | Enforces a private retrieval boundary. | `ws_quantum_charity` |
| `brand_id` | Yes | Labels the owning brand inside an enterprise organization. | `brand_charity_loves_ai` |
| `channel_id` | Yes | Limits a question to one authorized channel when needed. | YouTube channel ID, not the human creator name. |
| `video_id` | Yes | Resolves a result to the original YouTube video. | YouTube video ID. |
| `source_type` | Yes | Distinguishes owner-authorized, creator-uploaded, public-metadata, or public-text evidence. | `owner_caption` |
| `transcript_version` | Yes | Prevents stale citations after reprocessing or correction. | `v3` |
| `start_ms` and `end_ms` | Yes | Produces a precise timestamp link to the original video. | `494000` to `528000` |
| `language` | Yes | Applies language and translation filters. | `en` |
| `published_at` | Yes | Supports “recent only” and freshness filters. | ISO date-time. |
| `content_hash` | Yes | Detects duplicates and supports deletion verification. | SHA-256 hash. |
| `citation_id` | Yes | Resolves the response to the evidence manifest in the system of record. | `cit_01J...` |
| `text_pointer` | Yes, optional | Locates approved source text outside the vector database. | Encrypted object or relational-record key. |
| Full transcript text | **No by default** | Hydrate it only after a permitted retrieval result is selected. | Stored only under the configured evidence-retention policy. |
| Video, audio, image, thumbnail, or stream | **Never** | YouTube remains the media host. | Original YouTube URL only. |
| OAuth refresh token or user login credential | **Never** | Tokens are held separately in encrypted secrets storage. | Separate secrets vault record. |
| Email, payment, CRM, or client data | **Never** | These are outside the retrieval index. | Stored, if needed, in the relational system of record. |

The vector database therefore retains a **search index of permissioned knowledge**, not “the creator” and not “the channel.” It may contain one record per meaningful transcript segment. A video does not create a vector record until its available text is authorized and passes the source policy.

### Why the text itself should usually live outside the vector database

A retrieval query needs the source text for the final answer, but the vector service does not need to be the permanent text repository. After vector search returns 10–30 candidate `chunk_id` values, SignalVault should fetch the authorized, encrypted text from PostgreSQL or object storage, verify the caller’s workspace access again, rerank the passages, and send only the minimum cited passages to the answer model.

This “retrieve ID first, hydrate second” pattern reduces exposure, supports a clean deletion path, allows transcript corrections without rebuilding the entire account, and makes it possible to run a strict **metadata-only** mode. It also prevents large payload costs and awkward content retention inside the vector service.

## What SignalVault Stores by Source Mode

Not every customer needs the same retention model. A source policy should be explicit during setup and visible in Settings.

| Source mode | Intended use | Relational system of record | Object storage | Vector database | Retention default |
|---|---|---|---|---|---|
| **Reference Metadata** | Public competitive and inspiration research. | Channel/video IDs, titles, URLs, visible statistics, sync time, and expiration time. | None. | Optional title and description embeddings only. | Refresh or delete at 30 days. |
| **Bounded Public Evidence** | Public visible text that is permitted and sufficiently available to support a limited finding. | Source type, source URL, coverage score, extraction date, and expiration time. | Optional short permitted excerpts only. | Short excerpts or summaries, tagged as public and coverage-limited. | Short TTL, usually 30 days. |
| **Owned-Channel Vault** | A creator or brand’s authorized private channel knowledge system. | Consent record, video registry, transcript version, citation manifest, content hash, and deletion event. | Encrypted captions, approved transcript text, and generated exports only if the customer elects retention. | Segment embeddings with workspace, source, and timestamp filters. | Active subscription plus customer-configured retention. |
| **Creator-Supplied Assets** | Webinar transcript, training recording transcript, PDF, sales call notes, or an approved client case study. | File manifest, source owner, workspace, version, consent, and retention policy. | Encrypted customer-provided source. | Text segment embeddings and citation metadata. | Customer-configured. |
| **Visual Search Extension** | Future feature for thumbnails, slide frames, brand imagery, or video-frame search. | Asset manifest and rights. | Approved image/frame files only. | A separate multimodal vector index, never mixed with textual RAG. | Opt-in and customer-configured. |

**Creators are entities, not vectors.** A creator record belongs in PostgreSQL as part of the organization, brand, channel, and authorization model. The only reason to store a creator name in retrieval metadata is as a non-sensitive ownership label or filter. That is optional and should never be the tenant-isolation mechanism.

## Recommended Retention Controls

SignalVault needs a source-by-source, channel-by-channel control model. The account administrator should be able to choose **metadata only**, **last 90 days**, **all authorized text**, or **custom date range**. The default for a public Reference scan should be metadata only. The default for an owned-channel Vault can be “all authorized source text,” but only after clear consent.

For content discovery, the scheduled job should request current channel information and recent uploads directly from the YouTube API. It should not copy the media. The channel resource exposes the uploads playlist, which provides the canonical inventory path. [1] YouTube’s policies require transparency, user control, a privacy policy, and deletion of Authorized Data after authorization is revoked. Its policy states that application-controlled revocation must result in deletion as soon as possible and within seven calendar days. [2]

The deletion design should be **immediate logical exclusion plus asynchronous physical purge**. On a delete or OAuth revoke event, SignalVault immediately disables the `source_id` and refuses it in every retrieval filter. A job then deletes source text from object storage, transcript and citation rows from the relational database, embeddings from the vector database, cached response fragments, and analytics events that contain source excerpts. Store a deletion receipt with counts and completion timestamps. This lets SignalVault prove the source is gone without retaining the source itself.

## Enterprise Multi-Brand Isolation Model

A large customer can have one legal organization, multiple brands, several channels per brand, and several teams with different permissions. SignalVault must model those levels explicitly.

```text
Organization
  └── Brand
        └── Workspace
              ├── Authorized channel(s)
              ├── Creator-supplied asset sources
              ├── Reference board(s)
              ├── Citation and transcript manifests
              └── Workspace members and roles
```

A **workspace** is the hard RAG boundary. A brand can own several workspaces. For example, an enterprise can operate `Brand A / Sales`, `Brand A / Learning`, and `Brand B / Executive Thought Leadership` separately. A user sees only the workspaces where they have a current membership. An agency customer gets one workspace per client, never a shared “agency library.”

Cross-brand search must be disabled by default. It should require an organization-level administrator to create an explicit **Federated Knowledge Set**. The administrator selects which workspaces participate, what source classes are eligible, which role can query it, and whether the final answer may cite cross-brand results. Every federated answer displays the source brand and channel. This prevents a brand manager from accidentally exposing one division’s intellectual property to another.

### Relational system-of-record tables

| Domain | Core tables | Isolation rule |
|---|---|---|
| Identity and tenancy | `organizations`, `brands`, `workspaces`, `users`, `workspace_memberships`, `roles` | Every content-bearing record is tied to one `workspace_id`. |
| Sources | `channels`, `source_connections`, `source_policies`, `source_syncs`, `videos`, `transcript_versions` | A channel is only usable after a consent and source policy are recorded. |
| Evidence | `citation_manifests`, `text_chunks`, `content_hashes`, `deletion_jobs` | Citation manifests include source version and timestamp range. |
| Retrieval | `retrieval_requests`, `retrieval_results`, `answer_runs`, `evaluation_sets` | Queries record workspace, policy, retrieved source IDs, answer model, and citation IDs. |
| Commercial control | `subscriptions`, `usage_meters`, `archive_packs`, `entitlements` | Plan limits are enforced before an ingestion job or answer call. |
| Security | `audit_events`, `consent_events`, `oauth_token_refs`, `key_refs`, `access_reviews` | Tokens and encryption keys are references only, not ordinary content columns. |

Use PostgreSQL Row-Level Security (RLS) on every tenant-owned table. When RLS is enabled, PostgreSQL applies an explicit policy to normal reads and writes. If no policy exists, the default is deny. [3] The application must set the authenticated user ID and active workspace ID as transaction-scoped claims, and all queries must prove membership. The service account that owns tables must not bypass RLS in ordinary application code. Test negative cases in which a valid user is intentionally given a different `workspace_id`.

## Retrieval Design

SignalVault should use **hybrid, source-constrained retrieval** instead of raw vector similarity alone. The full request path is:

1. The user authenticates and chooses a workspace.
2. The authorization service resolves the user’s role, workspace ID, permitted channels, source modes, and any active Federated Knowledge Set.
3. The query service constructs a mandatory retrieval filter before calling the vector database.
4. The vector service returns candidate `chunk_id` values and minimal metadata from only the authorized workspace boundary.
5. The application hydrates the approved source text by `chunk_id`, checks its current source policy and deletion state, and runs lexical plus semantic reranking.
6. The answer model receives only the highest-ranked approved passages and must cite the `citation_id` attached to each passage.
7. The response returns the answer, confidence, evidence coverage, source title, original video link, and timestamp.
8. The audit log records the authorization context, retrieved IDs, answer version, and citation IDs. It does not need to store the full answer prompt indefinitely.

The answer model should be instructed to say **“I do not have sufficient authorized evidence”** when retrieval coverage is low. It should never infer a private-channel fact from Reference data. This is how the interface’s current evidence boundary becomes enforceable architecture rather than just persuasive copy.

### Chunking and citations

Use speech-aware chunks that preserve timestamp coherence. A practical default is **300–600 tokens per chunk**, a 10–15% text overlap, speaker or chapter boundaries where available, and a stable start and end timestamp. Preserve the unmodified source segment in the evidence store. Create separate derived records for summary, topic labels, claims, offers, objections, calls to action, and proof statements. Derived records must always point back to the source chunk and model/version that created them.

For each answer, retrieve 20–30 candidate chunks, use keyword and metadata search plus semantic similarity, rerank down to 5–8 sources, and quote only the 2–5 passages that directly support the answer. Do not treat the vector score as an evidence-confidence score. Confidence should combine retrieval quality, cross-source agreement, source completeness, citation coverage, and the source policy.

## Vector Database Options

SignalVault needs a relational database regardless of the vector choice. The vector database is an acceleration layer for retrieval. It must never become the tenant system of record or the authorization layer.

| Option | Isolation setup | Strengths | Tradeoffs | Best fit |
|---|---|---|---|---|
| **Managed PostgreSQL plus pgvector** | One `workspace_id` on every row, RLS enforced in PostgreSQL, HNSW index plus filtered query. | Lowest operational complexity. One transactional system for content records, membership, citations, and embeddings. Excellent for an internal Vault and early paid cohort. | Approximate-index filtering occurs after the HNSW index scan unless carefully tuned. Large multi-brand retrieval and independent vector scaling become harder to operate. [4] | Private pilot, early paid beta, and moderate retrieval volume. |
| **PostgreSQL plus Qdrant Cloud** | One collection per embedding model. Every vector includes `workspace_id` as a required tenant payload filter. Larger customers are promoted to dedicated shards or collections. | Strong filtering, hybrid search, payload indexes, tiered multitenancy, and a clear path from many small workspaces to isolated large accounts. Qdrant documents payload partitions for many small tenants and user-defined shards for stronger isolation. [5] | Requires a second managed datastore and strict application-layer filter enforcement. | B2B scale with many brands, agencies, and predictable enterprise expansion. |
| **PostgreSQL plus Pinecone Serverless** | One vector namespace per workspace, with separate indexes for separate workloads. | Namespace isolation is simple to reason about. Pinecone states that all vector writes and reads target a namespace and describes namespace isolation as a multitenant SaaS pattern. [6] | Less flexible for some application-level data layouts and may require vendor-specific cost planning as tenant count and query traffic grow. | Organizations that require strong workspace boundaries and prefer a fully managed vector service. |

### How to decide between the three setups

Start with **PostgreSQL plus pgvector** only if the first phase is Charity’s own channel plus a small paid cohort, the retrieval workload remains moderate, and the priority is validating the product outcome quickly. pgvector supports exact nearest-neighbor search by default and HNSW approximate indexes for faster retrieval, but it requires careful tuning when filters are selective. [4]

Use **PostgreSQL plus Qdrant Cloud** when SignalVault moves into a multi-brand, agency, or high-volume B2B environment. Qdrant’s documented multitenancy pattern uses a required tenant payload and can group tenant data for efficient reads. It also provides a tiered path where large enterprise customers can receive dedicated shards. [5] This makes it a strong architectural fit for SignalVault’s mix of many small customer workspaces and a smaller number of very large enterprise brands.

Use **PostgreSQL plus Pinecone Serverless** when the customer’s security review or internal architecture team favors physically segregated namespaces and a fully managed retrieval service. Pinecone’s namespace model is especially easy to explain during an enterprise security review. [6]

In every option, prohibit direct browser or mobile-app access to the vector provider. All writes and reads pass through the SignalVault server after a membership check. The client never receives the vector provider’s service key.

### Qdrant vector payload standard

If SignalVault chooses Qdrant, use one collection per embedding model and require the following payload shape. `workspace_id` is both the logical tenant and the mandatory filter. Qdrant’s `is_tenant=true` payload index groups a tenant’s vectors together for more efficient retrieval. [5]

```json
{
  "id": "chunk_01JQ4AB8",
  "vector": ["embedding values omitted"],
  "payload": {
    "workspace_id": "ws_01JQ",
    "brand_id": "brand_01HQ",
    "channel_id": "UC...",
    "video_id": "n9X...",
    "source_id": "src_01JQ",
    "citation_id": "cit_01JQ",
    "source_type": "owner_caption",
    "transcript_version": 3,
    "language": "en",
    "start_ms": 494000,
    "end_ms": 528000,
    "published_at": "2026-08-17T17:00:00Z",
    "content_hash": "sha256:...",
    "text_pointer": "evidence://src_01JQ/chunk_0042"
  }
}
```

The server must append the workspace filter itself. Do not accept a client-supplied `workspace_id` as a trusted filter. The request context, not the browser payload, supplies the boundary.

### Pinecone namespace standard

If SignalVault chooses Pinecone, make the namespace equal to a single workspace, such as `ws_01JQ`. Never use one namespace for an entire agency or enterprise organization. Brand-level or federated search is implemented by the application making multiple authorized workspace searches and merging only approved results. This keeps client data logically and operationally separate.

## Ingestion, Freshness, and Background Work

A production build cannot ingest an entire channel during an ordinary web request. Ingestion needs durable, idempotent background jobs. The application should publish work to a queue and return a source status immediately. Workers then do the following:

| Job | Trigger | What it reads | What it writes | Required protection |
|---|---|---|---|---|
| Channel discovery | Owner connects a channel or starts a scan. | Channel profile and uploads playlist. | Channel registry and candidate video IDs. | OAuth scopes, quota limits, idempotency key. |
| Incremental sync | Scheduled by source policy. | Recent uploads and changed metadata only. | Source-sync checkpoint, video registry, freshness status. | Per-channel cursor, rate limit, exponential retry. |
| Text acquisition | A permitted caption is available or the owner uploads text. | Approved captions or owner-provided transcripts. | Encrypted evidence object and transcript manifest. | Source-mode validation and content hash. |
| Processing | New transcript version arrives. | Evidence object. | Timestamp-aware chunks, structured claims, topic records, vectors. | Versioned model record and deterministic chunk IDs. |
| Reindex | Model changes or quality issue is detected. | Existing approved source text. | New vector collection or namespace version. | Blue-green index, no mixed embedding dimensions. |
| Deletion | User deletes a source or revokes access. | Source and retention manifest. | Deletion receipt and tombstone state. | Immediate retrieval exclusion, then physical purge. |
| Evaluation | New retrieval version is staged. | Synthetic and consented evaluation questions. | Evaluation score, regression alert, release status. | Never mix customer content across evaluation sets. |

For normal scheduled syncs and webhook handling, the managed application backend can run stateless jobs. The heavy or lengthy text-processing workload should run in bounded worker jobs with a durable queue. Do not rely on an in-memory background process inside a web request. If the production workflow needs custom binaries, high concurrency, or greater than the managed application’s resource ceiling, move workers into a dedicated container service. The user-facing application can remain managed and autoscaled while the processing plane is independently scalable.

## Security and Enterprise Controls

| Control | Required implementation |
|---|---|
| Authentication | Enterprise single sign-on through SAML or OpenID Connect. Multi-factor authentication is enforced by the identity provider. |
| Provisioning | SCIM or admin-managed user lifecycle for Enterprise. Remove workspace access immediately when a user is deprovisioned. |
| Authorization | Role-based access control plus workspace membership. Apply PostgreSQL RLS and application-level vector filters. |
| Encryption | Transport encryption everywhere. Envelope-encrypt approved evidence objects and OAuth token records using a cloud key-management service. |
| Token handling | Store OAuth refresh tokens only in a dedicated encrypted secrets store. Rotate, revoke, and never expose them to the frontend or vector service. |
| Auditability | Record login, membership change, source connection, query, source export, data deletion, and admin action events. |
| Source controls | Show channel-level status, last sync, coverage, retention rule, authorization state, re-index option, and delete/revoke option. |
| Data residency | Place PostgreSQL, object storage, vector provider, queue, and application compute in the same approved region per enterprise contract. |
| Backups | Encrypt backups. Test restore procedures. Make backup retention compatible with customer deletion requirements. |
| Model governance | Store model, embedding version, prompt policy, retrieval parameters, and cited source IDs for each answer. |
| Abuse prevention | Per-user rate limits, plan entitlements, bot detection, query-length limits, and retrieval result caps. |

## Service Separation and Scale Plan

The application should be split into a control plane, a data plane, and a retrieval plane. This keeps user-facing performance stable while indexing grows.

| Layer | Responsibility | Scaling behavior |
|---|---|---|
| Web application and API | Authentication, workspace authorization, Settings, billing, dashboards, source controls, and response rendering. | Stateless horizontal scaling. |
| Relational control plane | Tenancy, permissions, source manifest, citations, billing, audit, and deletion state. | Managed PostgreSQL with high availability, read replicas if analytics expands. |
| Evidence storage | Approved transcript content and exports only. | Encrypted object storage with lifecycle rules. |
| Ingestion and processing plane | Sync, caption processing, chunking, embeddings, metadata extraction, and re-indexing. | Queue-based workers that scale independently from the web application. |
| Retrieval plane | Query embedding, hybrid retrieval, hydration, reranking, citation assembly, and answer generation. | Independently scaled service with strict latency budgets. |
| Vector service | Candidate semantic retrieval constrained by workspace and source filters. | Managed vector cluster or serverless index, sharded by workload and tenant size. |
| Analytics plane | Aggregated usage and quality metrics, not raw source content. | Warehouse or relational read replica, with tenant-safe aggregation. |

## Implementation Roadmap

| Phase | Scope | Exit criterion |
|---|---|---|
| **Phase 1: Private proof** | One organization, one brand, owner-authorized channel, PostgreSQL source registry, encrypted transcript store, pgvector or one managed namespace, cited Q&A. | A hard question returns a correct answer with a working YouTube timestamp citation. |
| **Phase 2: Paid cohort** | Workspaces, memberships, source policies, queued ingestion, delete/revoke workflow, audit logging, usage controls, and Authority Vault reports. | Five paid customers can use isolated Vaults without manual database operations. |
| **Phase 3: Agency scale** | Client workspace provisioning, Reference metadata scan, persistent boards, shared operator accounts, GoHighLevel-approved exports, and per-client billing limits. | Agency can onboard a client without Charity manually constructing a data boundary. |
| **Phase 4: Enterprise** | SSO, SCIM, RLS test suite, enterprise audit export, dedicated retrieval tier, data-region choice, federated knowledge sets, and formal operational monitoring. | A security-conscious multi-brand account can pass an architecture review and prove cross-brand isolation. |

## The Practical Answer for SignalVault

Your instinct is correct: **do not “store the whole channel.”** Store a governed, minimal index of the text that the customer has authorized SignalVault to use. Keep the actual video on YouTube. Keep creator, brand, contract, access, and retention data in PostgreSQL. Keep raw approved text only where required for verifiable answers, encrypted, versioned, and deletable. Keep vectors only as retrieval pointers plus the minimal metadata needed to filter and cite them.

This design allows SignalVault to provide recent channel intelligence for Reference, private full-library RAG for authorized customers, and true enterprise multi-brand isolation without turning the platform into an uncontrolled archive of YouTube content.

## References

[1]: https://developers.google.com/youtube/v3/docs/channels "YouTube Data API Channels Reference"
[2]: https://developers.google.com/youtube/terms/developer-policies "YouTube API Services Developer Policies"
[3]: https://www.postgresql.org/docs/current/ddl-rowsecurity.html "PostgreSQL Row Security Policies"
[4]: https://github.com/pgvector/pgvector "pgvector: Open-Source Vector Similarity Search for Postgres"
[5]: https://qdrant.tech/documentation/manage-data/multitenancy/ "Qdrant Configure Multitenancy"
[6]: https://docs.pinecone.io/guides/index-data/implement-multitenancy "Pinecone Implement Multitenancy"

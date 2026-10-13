import {
  Archive,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  FolderUp,
  Gauge,
  LibraryBig,
  Link2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Play,
  Plus,
  Quote,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  filterPrototypeVideos,
  isUsablePublicChannelReference,
  isUsableQuestion,
  normalizeReferenceChannel,
} from "@/lib/prototype-utils";

type NavKey = "ask" | "library" | "topics" | "reference" | "opportunities";
type Citation = {
  id: string;
  title: string;
  date: string;
  timestamp: string;
  quote: string;
  score: string;
  color: string;
};

type Video = {
  id: string;
  title: string;
  date: string;
  duration: string;
  format: "Long-form" | "Short" | "Live";
  topic: string;
  summary: string;
  color: string;
  chapters: number;
};

const navigation: { id: NavKey; label: string; icon: typeof MessageCircle }[] = [
  { id: "ask", label: "Ask", icon: MessageCircle },
  { id: "library", label: "Library", icon: LibraryBig },
  { id: "topics", label: "Topics", icon: BrainCircuit },
  { id: "reference", label: "Reference", icon: BookOpen },
  { id: "opportunities", label: "Opportunities", icon: Target },
];

const citations: Citation[] = [
  {
    id: "ep-42",
    title: "The $3K AI Offer That Closes Faster",
    date: "May 24, 2026",
    timestamp: "08:14",
    quote:
      "Do not sell an AI tool. Sell the operational bottleneck it removes and make the outcome visible in the first 30 days.",
    score: "96% match",
    color: "from-[#F79C65] to-[#E66742]",
  },
  {
    id: "ep-37",
    title: "Why Local Businesses Buy Automation",
    date: "Apr 10, 2026",
    timestamp: "14:02",
    quote:
      "The owner does not wake up wanting automation. They wake up frustrated because leads came in and nobody followed up.",
    score: "92% match",
    color: "from-[#7B81F7] to-[#5058C9]",
  },
  {
    id: "ep-29",
    title: "From One-Off Projects to Monthly Retainers",
    date: "Feb 19, 2026",
    timestamp: "22:47",
    quote:
      "A retainer gets easier when the system has a monthly operating rhythm: review, optimize, protect conversion, report the gain.",
    score: "89% match",
    color: "from-[#5CC7B7] to-[#188A82]",
  },
];

const videos: Video[] = [
  {
    id: "ep-42",
    title: "The $3K AI Offer That Closes Faster",
    date: "May 24, 2026",
    duration: "18:42",
    format: "Long-form",
    topic: "AI Offers",
    summary: "A high-trust offer structure for local service businesses that want tangible automation outcomes.",
    color: "from-[#F7A06B] via-[#ED7050] to-[#CB453D]",
    chapters: 8,
  },
  {
    id: "ep-37",
    title: "Why Local Businesses Buy Automation",
    date: "Apr 10, 2026",
    duration: "26:10",
    format: "Long-form",
    topic: "Buyer Psychology",
    summary: "The real reasons business owners invest in lead-response and follow-up systems.",
    color: "from-[#8790FC] via-[#5D67E3] to-[#373B9F]",
    chapters: 11,
  },
  {
    id: "ep-33",
    title: "Your AI Agency Needs a Better Discovery Call",
    date: "Mar 18, 2026",
    duration: "12:08",
    format: "Long-form",
    topic: "Sales",
    summary: "Questions that expose expensive workflow friction before the solution is introduced.",
    color: "from-[#55C8B9] via-[#278F8B] to-[#115E67]",
    chapters: 6,
  },
  {
    id: "ep-29",
    title: "From One-Off Projects to Monthly Retainers",
    date: "Feb 19, 2026",
    duration: "31:54",
    format: "Long-form",
    topic: "Recurring Revenue",
    summary: "How to wrap a deployment into an ongoing optimization and reporting relationship.",
    color: "from-[#D785D8] via-[#A84EB0] to-[#6E2C84]",
    chapters: 12,
  },
  {
    id: "ep-21",
    title: "The Cost of a Missed Lead Is Not a Marketing Problem",
    date: "Jan 08, 2026",
    duration: "09:34",
    format: "Short",
    topic: "Lead Response",
    summary: "A concise argument for measuring response-time leakage in revenue, not vanity metrics.",
    color: "from-[#E6BC57] via-[#BF8425] to-[#87470F]",
    chapters: 4,
  },
  {
    id: "ep-18",
    title: "Build the System Before You Buy the Software",
    date: "Dec 12, 2025",
    duration: "42:18",
    format: "Live",
    topic: "Operations",
    summary: "A workshop on mapping the process before choosing automation tools or building workflows.",
    color: "from-[#74A7EB] via-[#4876C9] to-[#2D418D]",
    chapters: 15,
  },
];

const topicData = [
  { label: "AI Offers", count: 18, strength: "Core thesis", delta: "+4 episodes", color: "#f39a65" },
  { label: "Lead Response", count: 15, strength: "High authority", delta: "+2 episodes", color: "#67d1c3" },
  { label: "Recurring Revenue", count: 12, strength: "Emerging", delta: "+6 episodes", color: "#888dff" },
  { label: "Sales Calls", count: 10, strength: "High authority", delta: "+1 episode", color: "#db87d7" },
  { label: "Operations", count: 9, strength: "Foundation", delta: "Stable", color: "#e6ba58" },
  { label: "Client Proof", count: 6, strength: "Underused", delta: "+3 episodes", color: "#7ca9ed" },
];

const quickQuestions = [
  "What does the channel say about packaging AI automation offers?",
  "Where have I explained monthly retainers most clearly?",
  "What objections do I keep addressing before the offer?",
];

const answerBlocks = [
  "The channel is consistent: **package the business outcome, not the automation itself**. The strongest framing appears when the offer begins with a visible operational leak, then ties the system to a measurable early win.",
  "Across the cited episodes, the recommended structure is a focused deployment tied to one revenue-critical bottleneck, followed by a monthly operating rhythm that protects conversion and reports the gain. This makes the recurring component feel like stewardship rather than an arbitrary software fee.",
];

function SignalMark({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center rounded-[${small ? "12px" : "15px"}] bg-gradient-to-br from-[#F9B47D] via-[#EF7F58] to-[#DF4D44] shadow-[0_12px_28px_rgba(227,93,70,0.24)] ${small ? "h-8 w-8" : "h-10 w-10"}`}
    >
      <div className="absolute h-[62%] w-[62%] rotate-45 rounded-[4px] border-[2px] border-white/85" />
      <div className="absolute h-[18%] w-[18%] rounded-full bg-white" />
    </div>
  );
}

function VideoArt({ video, compact = false }: { video: Video; compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${video.color} ${compact ? "h-16 w-24" : "aspect-[16/10]"}`}>
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(45deg,rgba(255,255,255,.28)_1px,transparent_1px),linear-gradient(-45deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full border-[16px] border-white/20" />
      <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#0D1020]/30 backdrop-blur-sm">
        <Play className="ml-0.5 h-3.5 w-3.5 fill-white text-white" />
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-3 rounded-md bg-[#0d1020]/55 px-2 py-1 text-[10px] font-semibold tracking-[0.12em] text-white/90 backdrop-blur-sm">
          {video.format.toUpperCase()}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeNav, setActiveNav] = useState<NavKey>("ask");
  const [query, setQuery] = useState(quickQuestions[0]);
  const [askedQuestion, setAskedQuestion] = useState(quickQuestions[0]);
  const [activeCitation, setActiveCitation] = useState(citations[0].id);
  const [selectedVideo, setSelectedVideo] = useState(videos[0]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<"All" | Video["format"]>("All");
  const [importOpen, setImportOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const activeEvidence = citations.find((citation) => citation.id === activeCitation) ?? citations[0];
  const filteredVideos = filterPrototypeVideos(videos, librarySearch, selectedFormat);

  function askQuestion(nextQuestion: string) {
    setAskedQuestion(nextQuestion);
    setQuery(nextQuestion);
    setActiveCitation(citations[0].id);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isUsableQuestion(query)) return;
    askQuestion(query.trim());
  }

  function renderContent() {
    if (activeNav === "library") {
      return (
        <LibraryView
          videos={filteredVideos}
          selectedVideo={selectedVideo}
          search={librarySearch}
          selectedFormat={selectedFormat}
          onSearch={setLibrarySearch}
          onFormat={setSelectedFormat}
          onVideo={setSelectedVideo}
        />
      );
    }
    if (activeNav === "topics") return <TopicsView onAsk={(question) => { askQuestion(question); setActiveNav("ask"); }} />;
    if (activeNav === "reference") return <ReferenceView />;
    if (activeNav === "opportunities") return <OpportunitiesView onOpenAsk={() => setActiveNav("ask")} />;

    return (
      <AskView
        askedQuestion={askedQuestion}
        query={query}
        activeEvidence={activeEvidence}
        activeCitation={activeCitation}
        copied={copied}
        onQuery={setQuery}
        onSubmit={onSubmit}
        onQuickQuestion={askQuestion}
        onCitation={setActiveCitation}
        onCopy={() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0D18] text-[#F7F2E9] selection:bg-[#F29A66]/30 selection:text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/[0.07] bg-[#0D1020] px-4 py-5 lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <SignalMark />
          <div>
            <p className="font-serif text-[20px] font-semibold tracking-[-0.04em] text-[#FBF7F0]">SignalVault</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9EA4B5]">Private intelligence</p>
          </div>
        </div>

        <div className="mt-10 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#747B90]">Workspace</p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F4E8D7] text-[11px] font-bold text-[#2B1D21]">QC</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#F5F0E9]">Quantum Charity</p>
              <p className="mt-0.5 text-[10px] text-[#9299AA]">1 private channel</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[#858B9B]" />
          </div>
        </div>

        <nav className="mt-8 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNav;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                  active
                    ? "bg-[#F9F0E7] text-[#1B1621] shadow-[0_8px_18px_rgba(0,0,0,0.13)]"
                    : "text-[#A3A9B7] hover:bg-white/[0.045] hover:text-[#F6F1E9]"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#D65D4D]" : "text-[#878EA0] group-hover:text-[#D9DFEA]"}`} />
                <span className="font-medium">{item.label}</span>
                {item.id === "opportunities" && <span className="ml-auto rounded-md bg-[#F19A63]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#F6A36C]">3</span>}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#9299A9] transition hover:bg-white/[0.045] hover:text-white">
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="rounded-xl border border-[#f6b47d]/15 bg-gradient-to-br from-[#f6a16d]/10 to-transparent p-3.5">
            <div className="flex items-center gap-2 text-[#F5B07D]"><Sparkles className="h-3.5 w-3.5" /><span className="text-[11px] font-bold uppercase tracking-[0.12em]">Prototype mode</span></div>
            <p className="mt-2 text-xs leading-5 text-[#B7ADAA]">Your workspace is using private demonstration data.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.07] bg-[#0A0D18]/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 lg:hidden">
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-[#E6DFD6]" aria-label="Open navigation">
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <SignalMark small />
            <p className="truncate font-serif text-lg font-semibold tracking-[-0.04em]">SignalVault</p>
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F4E9DB]/10 text-[#F4B17E]"><BrainCircuit className="h-4 w-4" /></div>
            <div>
              <p className="text-sm font-semibold text-[#FBF6EF]">Channel intelligence</p>
              <p className="text-[11px] text-[#8E95A6]">Cited answers from your library</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#7FDCBD]/15 bg-[#7FDCBD]/[0.07] px-3 py-1.5 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7FDCBD] shadow-[0_0_8px_#7FDCBD]" />
              <span className="text-[11px] font-semibold text-[#9FE3CA]">Library indexed</span>
            </div>
            <button onClick={() => setImportOpen(true)} className="flex items-center gap-2 rounded-xl bg-[#F7EEE5] px-3 py-2 text-xs font-bold text-[#251B24] transition hover:bg-white sm:px-4">
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add source</span><span className="sm:hidden">Add</span>
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-x-3 top-[76px] z-40 rounded-2xl border border-white/10 bg-[#141827] p-2 shadow-2xl lg:hidden">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveNav(item.id); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${active ? "bg-[#F8EFE6] text-[#251B24]" : "text-[#C8CDD8]"}`}>
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </div>
        )}

        <main className="min-h-[calc(100vh-68px)] px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8 lg:pb-10">{renderContent()}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[74px] items-center justify-around border-t border-white/[0.08] bg-[#111522]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`flex min-w-[62px] flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition ${active ? "text-[#F7B17E]" : "text-[#8990A1]"}`}>
              <span className={`grid h-7 w-9 place-items-center rounded-lg ${active ? "bg-[#F79A65]/15" : ""}`}><Icon className="h-4 w-4" /></span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}

function AskView({
  askedQuestion,
  query,
  activeEvidence,
  activeCitation,
  copied,
  onQuery,
  onSubmit,
  onQuickQuestion,
  onCitation,
  onCopy,
}: {
  askedQuestion: string;
  query: string;
  activeEvidence: Citation;
  activeCitation: string;
  copied: boolean;
  onQuery: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onQuickQuestion: (question: string) => void;
  onCitation: (id: string) => void;
  onCopy: () => void;
}) {
  return (
    <div className="mx-auto max-w-[1440px] animate-in fade-in duration-500">
      <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_345px] xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2A16D]"><Sparkles className="h-3.5 w-3.5" /> Evidence-first research</div>
          <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#FAF5ED] sm:text-[42px]">Ask what your channel has already taught.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9FA6B5] sm:text-[15px]">Every answer is grounded in your library, linked to the exact moment, and shaped for the next strategic move.</p>
        </div>
        <div className="hidden rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 xl:block">
          <div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#D9DDE6]">Current library</p><span className="rounded-full bg-[#83DCC1]/10 px-2 py-1 text-[10px] font-bold text-[#8BDCC3]">READY</span></div>
          <div className="mt-3 flex items-end gap-6"><div><p className="font-serif text-2xl font-semibold text-[#FBF6EE]">47</p><p className="text-[11px] text-[#7F879A]">indexed episodes</p></div><div><p className="font-serif text-2xl font-semibold text-[#FBF6EE]">612</p><p className="text-[11px] text-[#7F879A]">evidence moments</p></div><div className="ml-auto pb-1 text-right"><p className="text-[11px] font-semibold text-[#E4A371]">Last updated</p><p className="mt-0.5 text-[11px] text-[#8C94A4]">12 min ago</p></div></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_345px]">
        <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111522] shadow-[0_22px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5"><div className="grid h-7 w-7 place-items-center rounded-lg bg-[#F5A06B]/12 text-[#F3A06A]"><Bot className="h-3.5 w-3.5" /></div><div><p className="text-xs font-semibold text-[#F3EFE9]">SignalVault Research</p><p className="text-[10px] text-[#8E96A6]">Citations required</p></div></div>
            <button onClick={onCopy} className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-2.5 py-1.5 text-[11px] font-medium text-[#A9B0C0] transition hover:border-white/15 hover:text-white"><Copy className="h-3 w-3" /> {copied ? "Copied" : "Copy answer"}</button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex gap-3.5">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#F2E5D7] text-[10px] font-bold text-[#392128]">QC</div>
              <div className="min-w-0 pt-1.5 text-sm leading-6 text-[#D4D7E0]">{askedQuestion}</div>
            </div>

            <div className="mt-7 flex gap-3.5">
              <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#F7AD79] to-[#E55E4D] text-white shadow-[0_8px_18px_rgba(226,91,72,0.22)]"><Sparkles className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.13em] text-[#F0A26F]">Library-grounded answer</p>
                <div className="space-y-3.5 text-sm leading-6 text-[#C7CDD9]">
                  {answerBlocks.map((block, index) => <p key={index} dangerouslySetInnerHTML={{ __html: block.replace(/\*\*(.*?)\*\*/g, "<strong class='text-[#F8F1E7] font-semibold'>$1</strong>") }} />)}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {citations.map((citation, index) => (
                    <button key={citation.id} onClick={() => onCitation(citation.id)} className={`group inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition ${activeCitation === citation.id ? "border-[#F5A16C]/35 bg-[#F5A16C]/10 text-[#FFD1B1]" : "border-white/[0.07] bg-white/[0.025] text-[#AEB5C3] hover:border-white/15 hover:text-[#EDE6DE]"}`}>
                      <span className={`grid h-4 w-4 place-items-center rounded text-[9px] font-bold ${activeCitation === citation.id ? "bg-[#F29B65] text-[#2A1920]" : "bg-white/[0.08]"}`}>{index + 1}</span>
                      <span className="text-[11px] font-semibold">{citation.timestamp}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border-l-2 border-[#F19A63] bg-[#F19A63]/[0.07] px-4 py-3.5">
                  <div className="flex gap-2.5"><Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#F6A16D]" /><div><p className="text-xs font-semibold text-[#F5D0B6]">Strategic read</p><p className="mt-1 text-xs leading-5 text-[#B8AFAE]">This is a positioning pattern, not just a topic. It can become a flagship audit, an onboarding diagnostic, and a recurring optimization offer.</p></div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.07] bg-[#0D1020]/45 p-3.5 sm:p-4">
            <form onSubmit={onSubmit} className="rounded-xl border border-white/[0.10] bg-[#171C2C] p-1.5 shadow-inner shadow-black/10 focus-within:border-[#F19A63]/45">
              <div className="flex items-center gap-2">
                <Search className="ml-2 h-4 w-4 shrink-0 text-[#8B93A4]" />
                <input value={query} onChange={(event) => onQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#F5F0E9] outline-none placeholder:text-[#71788B]" placeholder="Ask about anything in your channel..." />
                <button type="submit" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#F3A06B] text-[#291923] transition hover:bg-[#FFC08F]" aria-label="Ask question"><ArrowUpRight className="h-4 w-4" /></button>
              </div>
            </form>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none]">
              {quickQuestions.map((question) => <button key={question} onClick={() => onQuickQuestion(question)} className="shrink-0 rounded-full border border-white/[0.08] px-3 py-1.5 text-left text-[11px] text-[#9299AA] transition hover:border-[#F29B65]/30 hover:bg-[#F29B65]/[0.07] hover:text-[#F2D8C2]">{question}</button>)}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-white/[0.07] bg-[#111522] p-4 shadow-[0_22px_60px_rgba(0,0,0,0.16)] sm:p-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#F4EFE8]">Evidence trail</p><p className="mt-1 text-[11px] text-[#8D95A5]">3 episodes support this answer</p></div><button className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07] text-[#9EA6B7]"><MoreHorizontal className="h-4 w-4" /></button></div>
          <div className={`mt-5 overflow-hidden rounded-xl bg-gradient-to-br ${activeEvidence.color} p-4`}>
            <div className="flex items-center justify-between"><span className="rounded-md bg-black/20 px-2 py-1 text-[9px] font-bold tracking-[0.12em] text-white">EPISODE MATCH</span><span className="text-[10px] font-bold text-white/85">{activeEvidence.score}</span></div>
            <div className="mt-9 flex items-end justify-between"><div className="grid h-10 w-10 place-items-center rounded-full bg-white/20"><Play className="ml-0.5 h-4 w-4 fill-white text-white" /></div><span className="rounded-md bg-black/20 px-2 py-1 text-[11px] font-semibold text-white">{activeEvidence.timestamp}</span></div>
          </div>
          <div className="mt-4"><p className="text-sm font-semibold leading-5 text-[#F5F0E9]">{activeEvidence.title}</p><p className="mt-1.5 text-[11px] text-[#9098A8]">{activeEvidence.date} · {activeEvidence.timestamp}</p><div className="mt-4 border-l-2 border-[#F0A06C] pl-3"><Quote className="mb-1.5 h-3.5 w-3.5 text-[#F0A06C]" /><p className="text-xs leading-5 text-[#C2C6D0]">“{activeEvidence.quote}”</p></div></div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] py-2.5 text-xs font-semibold text-[#D9DDE6] transition hover:border-[#F19A63]/40 hover:bg-[#F19A63]/[0.07]"><Play className="h-3.5 w-3.5 fill-current" /> Open at {activeEvidence.timestamp}<ExternalLink className="h-3 w-3" /></button>
          <div className="mt-5 border-t border-white/[0.07] pt-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#7E8698]">Other supporting moments</p><div className="space-y-2.5">{citations.filter((citation) => citation.id !== activeEvidence.id).map((citation) => <button key={citation.id} onClick={() => onCitation(citation.id)} className="flex w-full items-center gap-3 text-left"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] text-[10px] font-bold text-[#AEB6C4]">{citation.timestamp}</span><span className="min-w-0 flex-1 truncate text-[11px] text-[#B2B8C5]">{citation.title}</span><ChevronRight className="h-3.5 w-3.5 text-[#6F7789]" /></button>)}</div></div>
        </aside>
      </div>
    </div>
  );
}

function LibraryView({
  videos,
  selectedVideo,
  search,
  selectedFormat,
  onSearch,
  onFormat,
  onVideo,
}: {
  videos: Video[];
  selectedVideo: Video;
  search: string;
  selectedFormat: "All" | Video["format"];
  onSearch: (value: string) => void;
  onFormat: (value: "All" | Video["format"]) => void;
  onVideo: (video: Video) => void;
}) {
  const formats: ("All" | Video["format"])[] = ["All", "Long-form", "Short", "Live"];
  return (
    <div className="mx-auto max-w-[1440px] animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2A16D]"><Archive className="h-3.5 w-3.5" /> Source library</div><h1 className="font-serif text-3xl font-semibold tracking-[-0.045em] text-[#FAF5ED] sm:text-[42px]">Your published knowledge.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9FA6B5]">Browse every indexed episode, its chapters, extracted topics, and source moments.</p></div>
        <div className="flex items-center gap-2"><div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-center"><p className="text-sm font-semibold text-[#F8F1E8]">47</p><p className="text-[10px] text-[#8F96A7]">episodes</p></div><div className="rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 py-2.5 text-center"><p className="text-sm font-semibold text-[#F8F1E8]">28h</p><p className="text-[10px] text-[#8F96A7]">indexed</p></div></div>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="rounded-2xl border border-white/[0.07] bg-[#111522] p-4 sm:p-5">
          <div className="flex flex-col gap-3 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0C1020] px-3"><Search className="h-4 w-4 shrink-0 text-[#8790A2]" /><input value={search} onChange={(event) => onSearch(event.target.value)} className="w-full bg-transparent py-2.5 text-sm text-[#F4F0EA] outline-none placeholder:text-[#6E778A]" placeholder="Search title or topic" /></div><button className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2.5 text-xs font-semibold text-[#AEB5C3]"><Clock3 className="h-3.5 w-3.5" /> Newest</button></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{formats.map((format) => <button key={format} onClick={() => onFormat(format)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${selectedFormat === format ? "bg-[#F6EEE5] text-[#2A1B22]" : "border border-white/[0.08] text-[#9299AA] hover:text-[#E9E5DF]"}`}>{format}</button>)}</div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">{videos.map((video) => <button key={video.id} onClick={() => onVideo(video)} className={`overflow-hidden rounded-xl border text-left transition ${selectedVideo.id === video.id ? "border-[#F4A16E]/45 bg-[#F4A16E]/[0.06]" : "border-white/[0.07] bg-white/[0.018] hover:border-white/[0.16]"}`}><VideoArt video={video} /><div className="p-3.5"><div className="flex items-center justify-between gap-2"><span className="rounded-md bg-white/[0.06] px-1.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#B6BDCA]">{video.topic}</span><span className="text-[10px] text-[#858D9E]">{video.duration}</span></div><p className="mt-2.5 line-clamp-2 text-sm font-semibold leading-5 text-[#F4EFE9]">{video.title}</p><p className="mt-2 text-[11px] text-[#8D95A5]">{video.date} · {video.chapters} chapters</p></div></button>)}
          {videos.length === 0 && <div className="col-span-2 rounded-xl border border-dashed border-white/[0.12] py-12 text-center text-sm text-[#9198A8]">No videos match that search.</div>}</div>
        </section>
        <aside className="h-fit rounded-2xl border border-white/[0.07] bg-[#111522] p-4 sm:p-5 xl:sticky xl:top-[92px]">
          <div className="flex items-center justify-between"><p className="text-sm font-semibold text-[#F4EFE9]">Episode detail</p><button className="text-[#8991A2]"><MoreHorizontal className="h-4 w-4" /></button></div>
          <div className="mt-4 overflow-hidden rounded-xl"><VideoArt video={selectedVideo} /></div>
          <p className="mt-4 font-serif text-xl font-semibold leading-6 tracking-[-0.03em] text-[#F7F1E9]">{selectedVideo.title}</p><p className="mt-2 text-xs leading-5 text-[#9CA3B2]">{selectedVideo.summary}</p>
          <div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Duration" value={selectedVideo.duration} /><Metric label="Moments" value="14" /><Metric label="Chapters" value={String(selectedVideo.chapters)} /></div>
          <div className="mt-5 border-t border-white/[0.07] pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7E8698]">Source chapters</p><div className="mt-3 space-y-2.5">{["The expensive bottleneck", "The offer structure", "The 30-day proof", "The monthly operating rhythm"].map((chapter, index) => <button key={chapter} className="flex w-full items-center gap-3 text-left"><span className="text-[10px] font-semibold text-[#F2A16D]">{String(index * 6 + 2).padStart(2, "0")}:14</span><span className="min-w-0 flex-1 truncate text-xs text-[#BBC1CD]">{chapter}</span><Play className="h-3 w-3 text-[#687184]" /></button>)}</div></div>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F6EEE5] py-2.5 text-xs font-bold text-[#251A22]"><MessageCircle className="h-3.5 w-3.5" /> Ask about this episode</button>
        </aside>
      </div>
    </div>
  );
}

function TopicsView({ onAsk }: { onAsk: (question: string) => void }) {
  return (
    <div className="mx-auto max-w-[1440px] animate-in fade-in duration-500">
      <div className="grid gap-5 xl:grid-cols-[1fr_345px] xl:items-end"><div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2A16D]"><BrainCircuit className="h-3.5 w-3.5" /> Knowledge map</div><h1 className="font-serif text-3xl font-semibold tracking-[-0.045em] text-[#FAF5ED] sm:text-[42px]">See the ideas you own.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9FA6B5]">Recurring themes, developing points of view, and the spaces your channel has not yet claimed.</p></div><div className="rounded-2xl border border-[#f3a16d]/16 bg-[#f3a16d]/[0.06] p-4"><div className="flex items-start gap-3"><Gauge className="mt-0.5 h-4 w-4 text-[#F3A16D]" /><div><p className="text-xs font-semibold text-[#F4D3BB]">Your authority is concentrated</p><p className="mt-1 text-[11px] leading-5 text-[#AD9B91]">AI Offers + Lead Response drive 41% of your source moments. Treat them as your signature territory.</p></div></div></div></div>
      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_345px]">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111522] p-5 sm:p-7"><div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:22px_22px]" /><div className="relative"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#F4EFE9]">Topic constellation</p><p className="mt-1 text-[11px] text-[#8D95A5]">Connection strength is based on shared source moments.</p></div><button className="rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-[#AAB2C0]">Last 12 months</button></div><div className="relative mt-8 h-[360px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#0D1120]/80 sm:h-[410px]"><div className="absolute left-[15%] top-[25%] h-px w-[42%] rotate-[21deg] bg-gradient-to-r from-[#F39A65]/0 via-[#F39A65]/60 to-[#67d1c3]/0" /><div className="absolute left-[39%] top-[36%] h-px w-[38%] rotate-[-20deg] bg-gradient-to-r from-[#F39A65]/0 via-[#888dff]/55 to-[#888dff]/0" /><div className="absolute left-[36%] top-[59%] h-px w-[36%] rotate-[22deg] bg-gradient-to-r from-[#67d1c3]/0 via-[#67d1c3]/55 to-[#db87d7]/0" />{topicData.map((topic, index) => { const positions = [["9%", "20%"], ["45%", "24%"], ["68%", "17%"], ["56%", "61%"], ["16%", "67%"], ["78%", "68%"]]; const [left, top] = positions[index]; return <div key={topic.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }}><button onClick={() => onAsk(`How does the channel connect ${topic.label} to its core offer?`)} className="group grid place-items-center rounded-full border border-white/10 text-center shadow-[0_10px_30px_rgba(0,0,0,.22)] transition hover:scale-105" style={{ width: `${Math.max(74, topic.count * 6)}px`, height: `${Math.max(74, topic.count * 6)}px`, background: `${topic.color}18`, boxShadow: `0 0 30px ${topic.color}20` }}><span className="px-2 text-[10px] font-bold leading-3 text-[#F7F2EA] sm:text-[11px]">{topic.label}</span></button><p className="mt-1.5 text-center text-[9px] font-semibold text-[#9EA6B6]">{topic.count} mentions</p></div>})}</div></div></section>
        <aside className="rounded-2xl border border-white/[0.07] bg-[#111522] p-4 sm:p-5"><div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#F3A16D]/12 text-[#F3A16D]"><Sparkles className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-[#F4EFE9]">Authority signals</p><p className="text-[11px] text-[#8D95A5]">What the library reveals</p></div></div><div className="mt-5 space-y-3">{topicData.map((topic) => <button key={topic.label} onClick={() => onAsk(`Summarize everything this channel says about ${topic.label}.`)} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3 text-left transition hover:border-white/[0.14]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: topic.color, boxShadow: `0 0 10px ${topic.color}` }} /><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-[#E6E6E7]">{topic.label}</span><span className="mt-0.5 block text-[10px] text-[#8D95A5]">{topic.strength} · {topic.count} episodes</span></span><span className="text-[10px] font-semibold text-[#AEB6C5]">{topic.delta}</span></button>)}</div><div className="mt-5 rounded-xl border border-dashed border-[#F3A16D]/30 bg-[#F3A16D]/[0.05] p-3.5"><p className="text-xs font-semibold text-[#F2D3BD]">White-space prompt</p><p className="mt-1.5 text-[11px] leading-5 text-[#B9AAA0]">You explain how to deploy systems. Your next authority move is to show the client’s before-and-after operating metrics.</p><button onClick={() => onAsk("What content would establish authority around before-and-after client operating metrics?")} className="mt-3 text-[11px] font-bold text-[#F4A16D]">Create a brief <ArrowUpRight className="inline h-3 w-3" /></button></div></aside>
      </div>
    </div>
  );
}

type PublicReferenceReport = {
  channel: { id: number; title: string; url: string; handle: string | null; subscriberCount: number | null; totalViews: number | null; isSaved: boolean; lastSyncedAt: Date; expiresAt: Date };
  metrics: { videoCount: number; cadence: string; topicPillars: number; coverage: number; indexedChunks: number };
  topics: Array<{ label: string; count: number }>;
  positioningPattern: string;
  sourcePolicy: string;
  recentVideos: Array<{ title: string; url: string; publishedLabel: string; format: string }>;
};

type PublicReferenceMatch = { chunkId: number; score: number; title: string | null; sourceUrl: string | null; sourceType: "channel_metadata" | "video_metadata"; excerpt: string };

function compactNumber(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function ReferenceView() {
  const [channelUrl, setChannelUrl] = useState("");
  const [report, setReport] = useState<PublicReferenceReport | null>(null);
  const [saved, setSaved] = useState(false);
  const [referenceQuestion, setReferenceQuestion] = useState("");
  const [matches, setMatches] = useState<PublicReferenceMatch[]>([]);
  const [queryBoundary, setQueryBoundary] = useState("");
  const channelIsValid = isUsablePublicChannelReference(channelUrl);
  const scanMutation = trpc.reference.scan.useMutation({
    onSuccess: (result) => {
      const nextReport = result as PublicReferenceReport;
      setReport(nextReport);
      setChannelUrl(nextReport.channel.url);
      setSaved(nextReport.channel.isSaved);
      setMatches([]);
      setQueryBoundary("");
    },
  });
  const saveMutation = trpc.reference.setSaved.useMutation({
    onSuccess: (result) => setSaved(result.saved),
  });
  const queryMutation = trpc.reference.query.useMutation({
    onSuccess: (result) => {
      setMatches(result.matches as PublicReferenceMatch[]);
      setQueryBoundary(result.boundary);
    },
  });

  function scanChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedChannel = normalizeReferenceChannel(channelUrl);
    if (!normalizedChannel) return;
    scanMutation.mutate({ channelUrl: normalizedChannel });
  }

  function askReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!report || referenceQuestion.trim().length < 3) return;
    queryMutation.mutate({ channelId: report.channel.id, question: referenceQuestion.trim() });
  }

  return (
    <div className="mx-auto max-w-[1440px] animate-in fade-in duration-500">
      <div className="grid gap-5 xl:grid-cols-[1fr_345px] xl:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2A16D]"><BookOpen className="h-3.5 w-3.5" /> Public channel research</div>
          <h1 className="max-w-3xl font-serif text-3xl font-semibold leading-[1.04] tracking-[-0.045em] text-[#FAF5ED] sm:text-[42px]">Find inspiration without confusing it with your own proof.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9FA6B5]">Reference is a separate public-evidence workspace for studying content patterns, positioning, topic gaps, and publishing momentum across any public channel.</p>
        </div>
        <div className="rounded-2xl border border-[#86DCC5]/15 bg-[#86DCC5]/[0.06] p-4">
          <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#90E1CB]" /><div><p className="text-xs font-semibold text-[#DCF4EA]">Evidence stays separated</p><p className="mt-1 text-[11px] leading-5 text-[#A6C5B8]">Public-reference findings never enter your private Vault or appear as your own cited knowledge.</p></div></div>
        </div>
      </div>

      <section className="mt-7 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111522] shadow-[0_22px_60px_rgba(0,0,0,0.16)]">
        <div className="grid gap-0 lg:grid-cols-[1.18fr_.82fr]">
          <div className="p-5 sm:p-7">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F2EAE1]"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#F3A16D]/12 text-[#F3A16D]"><Search className="h-3.5 w-3.5" /></span> Analyze a public channel</div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#9CA4B3]">Paste a YouTube channel URL or <span className="font-semibold text-[#C9CFD9]">@handle</span>. SignalVault indexes recent public metadata, titles, and descriptions into a separate 30-day Reference workspace.</p>
            <form onSubmit={scanChannel} className="mt-5">
              <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7E8798]">Public channel URL or handle</label>
              <div className="mt-2 flex flex-col gap-2 rounded-xl border border-white/[0.09] bg-[#0C1020] p-1.5 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-2 px-2"><Link2 className="h-4 w-4 shrink-0 text-[#8992A3]" /><input value={channelUrl} onChange={(event) => setChannelUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm text-[#F4F0EA] outline-none placeholder:text-[#667084]" placeholder="youtube.com/@channel or @channel" /></div>
                <button type="submit" disabled={!channelIsValid || scanMutation.isPending} className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#F3A16D] px-4 py-2.5 text-xs font-bold text-[#281923] transition hover:bg-[#FFC18F] disabled:cursor-not-allowed disabled:opacity-40"><Search className="h-3.5 w-3.5" /> {scanMutation.isPending ? "Indexing…" : "Analyze"}</button>
              </div>
              {scanMutation.error ? <p className="mt-3 text-xs leading-5 text-[#F5A18A]">{scanMutation.error.message}</p> : null}
            </form>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ReferenceFeature icon={Archive} title="Inventory" description="Videos, playlists, formats, and publishing rhythm." />
              <ReferenceFeature icon={BrainCircuit} title="Patterns" description="Topics, hooks, titles, CTAs, and positioning." />
              <ReferenceFeature icon={Target} title="Gaps" description="Unclaimed angles and useful reference prompts." />
            </div>
          </div>
          <div className="border-t border-white/[0.07] bg-[#0D1020]/70 p-5 lg:border-l lg:border-t-0 sm:p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#7D8697]">What Reference can and cannot claim</p>
            <div className="mt-4 space-y-3">
              <EvidenceRule label="Public metadata" detail="Channel inventory, titles, descriptions, dates, playlists, and visible metrics." status="available" />
              <EvidenceRule label="Public text evidence" detail="Only permitted, available text is summarized and labeled with its coverage." status="limited" />
              <EvidenceRule label="Private transcript access" detail="Never assumed. Owner authorization or creator-provided files are required." status="protected" />
            </div>
          </div>
        </div>
      </section>

      {report ? (
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_345px]">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111522] p-4 sm:p-5">
            <div className="flex flex-col gap-4 border-b border-white/[0.07] pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-[#7983FC] via-[#5360D0] to-[#32347E] text-sm font-bold text-white"><span className="absolute -right-2 -top-3 h-9 w-9 rounded-full border-[7px] border-white/20" />RS</div>
                <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-xl font-semibold tracking-[-0.03em] text-[#F6F0E8]">{report.channel.title}</h2><span className="rounded-full border border-[#84DCC5]/20 bg-[#84DCC5]/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-[#93E1CC]">Live metadata index</span></div><p className="mt-1 text-[11px] text-[#8E96A6]">{report.channel.handle ?? report.channel.url} · refreshed {report.channel.lastSyncedAt.toLocaleString()}</p></div>
              </div>
              <button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate({ channelId: report.channel.id, saved: !saved })} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition disabled:opacity-50 ${saved ? "border-[#84DCC5]/30 bg-[#84DCC5]/10 text-[#9DE2CB]" : "border-white/[0.1] text-[#D8DCE3] hover:border-white/20 hover:bg-white/[0.04]"}`}><BookOpen className="h-3.5 w-3.5" /> {saved ? "Saved to board" : "Save to reference board"}</button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <ReferenceMetric value={String(report.metrics.videoCount)} label="recent public videos" />
              <ReferenceMetric value={report.metrics.cadence} label="publish cadence" />
              <ReferenceMetric value={String(report.metrics.topicPillars)} label="topic pillars" />
              <ReferenceMetric value={`${report.metrics.coverage}%`} label="metadata coverage" accent />
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-xl border border-white/[0.07] bg-[#0D1120] p-4">
                <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#F1ECE5]">Public positioning pattern</p><p className="mt-1 text-[11px] text-[#838C9D]">Derived from recent titles and available public descriptions.</p></div><FileText className="h-4 w-4 text-[#A1A8B7]" /></div>
                <p className="mt-4 text-sm leading-6 text-[#BFC5D1]">{report.positioningPattern}</p>
                <div className="mt-4 flex flex-wrap gap-2">{report.topics.map(topic => <ReferenceChip key={topic.label} label={`${topic.label} · ${topic.count}`} />)}</div>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#0D1120] p-4"><p className="text-sm font-semibold text-[#F1ECE5]">Channel footprint</p><div className="mt-4 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-[#BBC2CE]">Subscribers</span><span className="font-semibold text-[#F1ECE5]">{compactNumber(report.channel.subscriberCount)}</span></div><div className="flex items-center justify-between text-xs"><span className="text-[#BBC2CE]">Public views</span><span className="font-semibold text-[#F1ECE5]">{compactNumber(report.channel.totalViews)}</span></div><div className="flex items-center justify-between text-xs"><span className="text-[#BBC2CE]">Indexed metadata chunks</span><span className="font-semibold text-[#F1ECE5]">{report.metrics.indexedChunks}</span></div></div></div>
            </div>

            <div className="mt-4 rounded-xl border border-[#F1A16D]/18 bg-[#F1A16D]/[0.055] p-4"><div className="flex gap-3"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#F3A16D]" /><div><p className="text-xs font-semibold text-[#F2D3BD]">Reference prompt for your Vault</p><p className="mt-1.5 text-xs leading-5 text-[#B7A79E]">Study the dominant public pattern here, then ask your private channel: “Where do I already have proof for this promise, and what should I publish next to make it mine?”</p></div></div></div>

            <form onSubmit={askReference} className="mt-4 rounded-xl border border-white/[0.07] bg-[#0D1120] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-[#F1ECE5]">Ask this metadata index</p><p className="mt-1 text-[11px] text-[#8A93A3]">Retrieves only indexed public titles and descriptions.</p></div><span className="rounded-full border border-[#8990FD]/20 bg-[#8990FD]/10 px-2 py-1 text-[9px] font-bold tracking-[0.1em] text-[#A9AEFF]">BOUNDED RAG</span></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={referenceQuestion} onChange={(event) => setReferenceQuestion(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#111522] px-3 py-2.5 text-sm text-[#F3EEE7] outline-none placeholder:text-[#697385]" placeholder="What public themes are repeated in recent titles?" /><button disabled={queryMutation.isPending || referenceQuestion.trim().length < 3} className="rounded-lg bg-[#7580F4] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#8D96FF] disabled:cursor-not-allowed disabled:opacity-40">{queryMutation.isPending ? "Searching…" : "Search index"}</button></div>{queryMutation.error ? <p className="mt-3 text-xs text-[#F5A18A]">{queryMutation.error.message}</p> : null}{matches.length > 0 ? <div className="mt-4 space-y-2">{matches.map(match => <a key={match.chunkId} href={match.sourceUrl ?? report.channel.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-[#8990FD]/30"><div className="flex items-center justify-between gap-3"><p className="truncate text-xs font-semibold text-[#DDE1E8]">{match.title ?? "Channel metadata"}</p><span className="shrink-0 text-[10px] font-bold text-[#A9AEFF]">{match.score}% match</span></div><p className="mt-1.5 text-[11px] leading-5 text-[#9FA7B5]">{match.excerpt}</p></a>)}</div> : null}{queryBoundary ? <p className="mt-3 text-[10px] leading-4 text-[#7F899A]">{queryBoundary}</p> : null}</form>

            {report.recentVideos.length > 0 ? <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><p className="text-xs font-semibold text-[#E5E8ED]">Recent public sources</p><div className="mt-3 space-y-2">{report.recentVideos.map(video => <a key={video.url} href={video.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]"><div className="min-w-0"><p className="truncate text-xs text-[#CAD0DA]">{video.title}</p><p className="mt-1 text-[10px] text-[#7F8999]">{video.publishedLabel} · {video.format}</p></div><ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#96A0B0]" /></a>)}</div></div> : null}
          </div>

          <aside className="h-fit rounded-2xl border border-white/[0.07] bg-[#111522] p-4 sm:p-5 xl:sticky xl:top-[92px]">
            <div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#F1ECE5]">Evidence coverage</p><p className="mt-1 text-[11px] text-[#8C95A5]">Public-reference confidence, not private access.</p></div><Gauge className="h-4 w-4 text-[#F3A16D]" /></div>
            <div className="mt-5 rounded-xl border border-white/[0.07] bg-[#0D1120] p-4"><div className="flex items-end justify-between"><div><span className="font-serif text-4xl font-semibold tracking-[-0.05em] text-[#F6F0E8]">{report.metrics.coverage}</span><span className="ml-1 text-lg text-[#AAB1BE]">/100</span></div><span className="rounded-full bg-[#F1A16D]/12 px-2 py-1 text-[10px] font-bold text-[#F2A16D]">METADATA</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-gradient-to-r from-[#F2A16D] to-[#F7C06E]" style={{ width: `${report.metrics.coverage}%` }} /></div><p className="mt-3 text-[11px] leading-5 text-[#9CA4B2]">{report.sourcePolicy}</p></div>
            <div className="mt-5 border-t border-white/[0.07] pt-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7F8899]">Boundaries built in</p><div className="mt-3 space-y-3"><BoundedItem label="Recent public metadata" detail="Stored as a separate 30-day Reference index." /><BoundedItem label="No transcript assumption" detail="Search matches never claim private caption access." /><BoundedItem label="No private Vault pollution" detail="Public ideas never become your evidence." /></div></div>
          </aside>
        </section>
      ) : (
        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <ReferenceEmptyCard icon={Search} title="Scan a channel" description="Paste a URL to stage a public-content reference report." />
          <ReferenceEmptyCard icon={BookOpen} title="Save what matters" description="Build a separate inspiration board without mixing outside ideas into your own Vault." />
          <ReferenceEmptyCard icon={ArrowUpRight} title="Translate, then differentiate" description="Use public patterns to generate sharper questions for your private library." />
        </section>
      )}
    </div>
  );
}

function ReferenceFeature({ icon: Icon, title, description }: { icon: typeof Archive; title: string; description: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"><Icon className="h-4 w-4 text-[#F3A16D]" /><p className="mt-3 text-xs font-semibold text-[#E6E8ED]">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#8E97A7]">{description}</p></div>;
}

function EvidenceRule({ label, detail, status }: { label: string; detail: string; status: "available" | "limited" | "protected" }) {
  const tone = status === "available" ? "#82DCC5" : status === "limited" ? "#F3A16D" : "#A4A9FD";
  const text = status === "available" ? "PUBLIC" : status === "limited" ? "CONDITIONAL" : "PROTECTED";
  return <div className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tone, boxShadow: `0 0 10px ${tone}` }} /><div><div className="flex items-center gap-2"><p className="text-xs font-semibold text-[#D8DDE5]">{label}</p><span className="text-[9px] font-bold tracking-[0.1em]" style={{ color: tone }}>{text}</span></div><p className="mt-1 text-[11px] leading-5 text-[#8D96A7]">{detail}</p></div></div>;
}

function ReferenceMetric({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return <div className={`rounded-xl border p-3 ${accent ? "border-[#F1A16D]/20 bg-[#F1A16D]/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}><p className={`font-serif text-2xl font-semibold tracking-[-0.04em] ${accent ? "text-[#F4A16D]" : "text-[#F3EEE7]"}`}>{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.11em] text-[#838C9D]">{label}</p></div>;
}

function ReferenceChip({ label }: { label: string }) {
  return <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold text-[#ABB3C0]">{label}</span>;
}

function BoundedItem({ label, detail }: { label: string; detail: string }) {
  return <div className="flex gap-2.5"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#86DCC5]" /><div><p className="text-[11px] font-semibold text-[#CBD1DA]">{label}</p><p className="mt-0.5 text-[10px] leading-4 text-[#8992A2]">{detail}</p></div></div>;
}

function ReferenceEmptyCard({ icon: Icon, title, description }: { icon: typeof Search; title: string; description: string }) {
  return <div className="rounded-2xl border border-white/[0.07] bg-[#111522] p-5"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#F3A16D]/10 text-[#F3A16D]"><Icon className="h-4 w-4" /></div><p className="mt-5 font-serif text-lg font-semibold tracking-[-0.03em] text-[#F3EEE7]">{title}</p><p className="mt-2 text-xs leading-5 text-[#939BAB]">{description}</p></div>;
}

function OpportunitiesView({ onOpenAsk }: { onOpenAsk: () => void }) {
  const opportunities = [
    { title: "Turn the lead-response thesis into a premium audit", type: "Offer opportunity", impact: "High revenue leverage", description: "Your strongest evidence cluster already names the pain, cost, and first-month win. Package it into a paid diagnostic that earns the implementation conversation.", action: "Create audit outline", icon: Target, color: "#F3A16D" },
    { title: "Record a proof-first retainer case study", type: "Content gap", impact: "High authority", description: "You explain the recurring operating rhythm clearly, but only 2 episodes show the before-and-after proof. One strong case study closes that credibility gap.", action: "Draft video brief", icon: BarChart3, color: "#72D2C2" },
    { title: "Build a local-business objection library", type: "Sales enablement", impact: "Faster closes", description: "The channel repeats 11 objections before discussing the offer. Convert those moments into a cited objection-handling asset for discovery calls.", action: "Generate asset", icon: ShieldCheck, color: "#8B90FF" },
  ];
  return (
    <div className="mx-auto max-w-[1440px] animate-in fade-in duration-500"><div><div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#F2A16D]"><Target className="h-3.5 w-3.5" /> Content to revenue</div><h1 className="font-serif text-3xl font-semibold tracking-[-0.045em] text-[#FAF5ED] sm:text-[42px]">Make your archive do more work.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#9FA6B5]">Turn source-backed ideas into offers, proof assets, and the next best content move.</p></div><div className="mt-7 grid gap-4 lg:grid-cols-3">{opportunities.map((opportunity, index) => { const Icon = opportunity.icon; return <article key={opportunity.title} className="flex min-h-[310px] flex-col rounded-2xl border border-white/[0.07] bg-[#111522] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.14]"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${opportunity.color}18`, color: opportunity.color }}><Icon className="h-5 w-5" /></div><span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-bold text-[#AEB6C4]">0{index + 1}</span></div><div className="mt-6"><p className="text-[10px] font-bold uppercase tracking-[0.13em]" style={{ color: opportunity.color }}>{opportunity.type}</p><h2 className="mt-2 font-serif text-xl font-semibold leading-6 tracking-[-0.03em] text-[#F4EFE9]">{opportunity.title}</h2><p className="mt-3 text-xs leading-5 text-[#9EA5B3]">{opportunity.description}</p></div><div className="mt-auto pt-5"><div className="mb-4 flex items-center gap-2 text-[11px] font-semibold text-[#B6BDCA]"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: opportunity.color }} />{opportunity.impact}</div><button onClick={onOpenAsk} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] py-2.5 text-xs font-bold text-[#E8E3DD] transition hover:bg-white/[0.06]">{opportunity.action}<ArrowUpRight className="h-3.5 w-3.5" /></button></div></article>})}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-white/[0.07] bg-[#111522] p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-[#F4EFE9]">Content-to-revenue map</p><p className="mt-1 text-[11px] text-[#8E96A6]">One topic. One clear path to commercial action.</p></div><Link2 className="h-4 w-4 text-[#F0A16D]" /></div><div className="mt-5 grid gap-2 md:grid-cols-4">{["Lead response\nsource thesis", "Paid diagnostic\nentry offer", "Implementation\ncore service", "Optimization\nmonthly retainer"].map((item, index) => <div key={item} className="relative rounded-xl border border-white/[0.07] bg-[#0D1020] p-3"><span className="text-[10px] font-bold text-[#F3A16D]">0{index + 1}</span><p className="mt-5 whitespace-pre-line text-xs font-semibold leading-5 text-[#D8DCE4]">{item}</p>{index < 3 && <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full border border-white/[0.09] bg-[#111522] p-1 text-[#F2A16D] md:block" />}</div>)}</div></section><section className="rounded-2xl border border-[#70D2C1]/15 bg-gradient-to-br from-[#70D2C1]/[0.08] to-transparent p-5"><div className="flex gap-3"><Check className="mt-0.5 h-4 w-4 text-[#82DCC7]" /><div><p className="text-sm font-semibold text-[#E3F2EC]">Prototype principle</p><p className="mt-2 text-xs leading-5 text-[#A8BBB5]">A recommendation is only useful when the system makes the next action obvious. SignalVault should connect every insight to a revenue, authority, or operations move.</p><button onClick={onOpenAsk} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#9EE0CD]">Ask for a revenue plan <ArrowUpRight className="h-3.5 w-3.5" /></button></div></div></section></div></div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-white/[0.04] px-2 py-2.5 text-center"><p className="text-xs font-semibold text-[#EEE8E0]">{value}</p><p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#7E8798]">{label}</p></div>;
}

function ImportModal({ onClose }: { onClose: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  return <div className="fixed inset-0 z-50 grid place-items-end bg-[#080A12]/70 p-3 backdrop-blur-sm sm:place-items-center sm:p-6"><div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.12] bg-[#151A2A] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-2.5"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#F3A16D]/12 text-[#F3A16D]"><FolderUp className="h-4 w-4" /></div><div><p className="text-sm font-semibold text-[#F5F0E9]">Add a source</p><p className="text-[11px] text-[#8F97A7]">Prototype intake workflow</p></div></div><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-[#8E96A6] hover:bg-white/[0.06]"><X className="h-4 w-4" /></button></div>{submitted ? <div className="p-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#7FDCC4]/15 text-[#8EE0C8]"><Check className="h-5 w-5" /></div><h3 className="mt-4 font-serif text-xl font-semibold text-[#F4EFE9]">Intake staged.</h3><p className="mt-2 text-sm leading-6 text-[#9FA6B5]">For the hosted build, this becomes a secure owner-channel connection or transcript upload workflow with indexing progress.</p><button onClick={onClose} className="mt-5 rounded-xl bg-[#F5EEE6] px-4 py-2.5 text-xs font-bold text-[#271B23]">Done</button></div> : <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="p-5"><p className="text-sm leading-6 text-[#ADB4C1]">Add a channel URL now to stage the source. Live owner-authenticated channel syncing is intentionally reserved for the hosted implementation.</p><label className="mt-5 block text-[11px] font-bold uppercase tracking-[0.13em] text-[#8891A2]">Channel URL</label><div className="mt-2 flex items-center gap-2 rounded-xl border border-white/[0.09] bg-[#0D1120] px-3"><Link2 className="h-4 w-4 text-[#8590A2]" /><input required placeholder="youtube.com/@yourchannel" className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#667084]" /></div><div className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#F3A16D]/15 bg-[#F3A16D]/[0.05] p-3"><CircleHelp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F3A16D]" /><p className="text-[11px] leading-5 text-[#B7A69D]">The production version will only index owner-authorized captions or transcripts you supply, preserving source control and evidence quality.</p></div><button type="submit" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#F3A16D] py-3 text-sm font-bold text-[#2A1A23]">Stage source intake <ArrowUpRight className="h-4 w-4" /></button></form>}</div></div>;
}

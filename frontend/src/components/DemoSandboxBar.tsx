'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, PRESET_DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useEscrow } from '@/context/EscrowContext';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Play,
  Briefcase,
  Crown,
  Users,
  Bot,
  Send,
  Loader2,
  X,
  Zap,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  isAI?: boolean;
  chips?: string[];
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Off-Topic Guard ────────────────────────────────────────────────────────
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(war|battle|history|world war|wwi|wwii|revolution|empire|colonial|dynasty|ancient|medieval|civil war|napoleon|hitler|vietnam|iraq|cold war|holocaust|genocide|invasion)\b/i,
  /\b(korean|japanese|chinese|arabic|french|spanish|german|hindi|malay|thai|turkish|russian|latin|grammar|translate|translation|vocabulary|pronunciation|language lesson)\b/i,
  /\b(recipe|cook|bake|ingredient|dish|food|meal|cuisine|restaurant|chicken|beef|pasta|cake|soup|salad)\b/i,
  /\b(football|soccer|basketball|tennis|cricket|baseball|golf|olympic|world cup|fifa|nba|nfl|epl|champion league|f1|formula one|athlete|tournament)\b/i,
  /\b(movie|film|series|drama|anime|manga|netflix|spotify|music|song|singer|actor|actress|celebrity|kpop|k-pop|bts|blackpink|marvel|disney|youtube)\b/i,
  /\b(biology|chemistry|physics|mathematics|calculus|algebra|astronomy|planet|dinosaur|evolution|climate change|earthquake|volcano)\b/i,
  /\b(capital of|country|continent|ocean|mountain|river|tourist|travel|vacation|flight|hotel|visa|passport)\b/i,
  /\b(medicine|drug|symptom|disease|doctor|hospital|vitamin|diet|exercise|calorie|blood pressure|vaccine)\b/i,
  /\b(relationship|girlfriend|boyfriend|marriage|dating|love advice|breakup|family problem|parenting)\b/i,
  /\b(tell me a joke|tell me a story|write a poem|write an essay|what is the meaning of life|ignore (your|all) instructions)\b/i,
];

const OFF_TOPIC_REPLY = "🚫 I'm **SuiPact AI Co-Pilot** — specialized for this platform only. Ask me about escrows, zkLogin, Sui blockchain, or basis point splits!";
const OFF_TOPIC_CHIPS = ['What is SuiPact?', 'How does escrow work?', 'What is zkLogin?'];

// ── FAQ Patterns ───────────────────────────────────────────────────────────
const FAQ_PATTERNS: Array<{ patterns: RegExp[]; answer: string; chips?: string[] }> = [
  {
    patterns: [/what is suipact/i, /suipact/i, /what does this (app|do)/i],
    answer: '**SuiPact** is a zero-gas USDC escrow on Sui Testnet. Clients lock funds, freelancers deliver proof, and the blockchain atomically splits payouts to the whole team — with $0 gas fees!',
    chips: ['How does zkLogin work?', 'What is a PTB?', 'How do I get USDC?'],
  },
  {
    patterns: [/zklogin|zk login|google sign.?in|google auth/i],
    answer: '**zkLogin** lets you sign in with your Google account. Your OAuth token is converted into a Sui wallet address — no seed phrases or extensions needed!',
    chips: ['What is gas?', 'What is SuiPact?'],
  },
  {
    patterns: [/basis.?points?|bps|percentage split/i],
    answer: '**Basis Points (bps):** 1% = 100 bps, total must = **10,000 bps**. Example: 60% Lead Dev = 6000, 30% Designer = 3000, 10% QA = 1000.',
    chips: ['How does escrow work?', 'What is a PTB?'],
  },
  {
    patterns: [/ptb|programmable transaction|atomic/i],
    answer: 'A **PTB (Programmable Transaction Block)** bundles multiple operations into one atomic Sui transaction. SuiPact pays ALL team members simultaneously in a single on-chain call!',
    chips: ['How does escrow work?', 'What is gas?'],
  },
  {
    patterns: [/gas|fee|cost|free/i],
    answer: 'SuiPact uses a **Sponsored Gas Relayer** — our backend co-signs transactions so users pay **$0.00 in gas fees**. You can transact with a completely empty wallet!',
    chips: ['How does zkLogin work?', 'What is SuiPact?'],
  },
  {
    patterns: [/how.*(get|fund|faucet|test|usdc|mint)/i, /usdc/i],
    answer: 'Click **"Get Test Funds"** in the app for free Testnet USDC. It\'s simulated for demo — production would use real USDC via Stripe or MoonPay.',
    chips: ['What is SuiPact?', 'How does escrow work?'],
  },
  {
    patterns: [/how.*(escrow|work|process|flow)/i, /status|locked|delivered|released/i],
    answer: 'Lifecycle: **1) Client locks USDC → 2) Freelancer submits proof → 3) AI audits → 4) Client approves → 5) Atomic split** to team in one transaction!',
    chips: ['What is a PTB?', 'What is basis points?'],
  },
  {
    patterns: [/help|what can you do|capabilities/i],
    answer: 'I\'m the **SuiPact AI Co-Pilot**! Ask me about escrows, zkLogin, Sui blockchain, basis points, gas sponsorship, or how to navigate the app.',
    chips: ['What is SuiPact?', 'What is zkLogin?', 'What are basis points?'],
  },
];

const WELCOME_MSG: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  content: "👋 Hi! I'm your **SuiPact AI Co-Pilot**. Ask me about escrows, zkLogin, splits, or the Sui blockchain!",
  chips: ['What is SuiPact?', 'How does zkLogin work?', 'What are basis points?'],
};

// ── Main Component ─────────────────────────────────────────────────────────
export const DemoSandboxBar: React.FC = () => {
  const { user, loginWithDemo, resetDemoState } = useAuth();
  const { resetEscrows } = useEscrow();
  const router = useRouter();

  // Sandbox state
  const [isOpen, setIsOpen] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Chat mode state — when true, panel shows chat instead of sandbox controls
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // AI Quota state: 10 free AI queries/month per account
  const [quota, setQuota] = useState<{ remaining: number; total: number; used: number }>({
    remaining: 10,
    total: 10,
    used: 0,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accountKey = user?.address || user?.email || 'guest';

  // Fetch quota on mount or account switch
  const fetchQuota = async () => {
    try {
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001';
      const res = await fetch(`${relayerUrl}/api/ai/quota?userId=${encodeURIComponent(accountKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.remaining === 'number') {
          setQuota({ remaining: data.remaining, total: data.total, used: data.used });
        }
      }
    } catch {
      // ignore network errors in demo
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [accountKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatMode && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [chatMode, isOpen]);

  // ── Demo actions ───────────────────────────────────────────────────────
  const handleStartDemoFlow = () => {
    loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
    router.push('/dashboard');
  };
  const handleSwitchToAlice = () => loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
  const handleSwitchToBob = () => loginWithDemo(PRESET_DEMO_ACCOUNTS[1]);
  const handleSwitchToCharlie = () => loginWithDemo(PRESET_DEMO_ACCOUNTS[2]);
  
  const handleFullReset = async () => {
    setIsResetting(true);
    try {
      resetDemoState();
      await resetEscrows();
      // Reset AI Quota for this demo account
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001';
      await fetch(`${relayerUrl}/api/ai/reset-quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: accountKey }),
      }).catch(() => {});
      setQuota({ remaining: 10, total: 10, used: 0 });

      loginWithDemo(PRESET_DEMO_ACCOUNTS[0]);
      router.push('/dashboard');
    } finally {
      setIsResetting(false);
    }
  };

  // ── Chat send handler ─────────────────────────────────────────────────
  const sendMessage = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput('');
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: messageText };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    // Layer 0: Off-topic guard (0 tokens, unlimited)
    if (OFF_TOPIC_PATTERNS.some(p => p.test(messageText))) {
      setLoading(false);
      setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: OFF_TOPIC_REPLY, chips: OFF_TOPIC_CHIPS }]);
      return;
    }

    // Action shortcuts (0 tokens, unlimited)
    if (/create.*(escrow|contract|new)|new escrow/i.test(messageText)) {
      setLoading(false);
      setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: '**Taking you to Create Escrow!** 🚀', isAI: false }]);
      setTimeout(() => { setChatMode(false); router.push('/escrow/new'); }, 700);
      return;
    }
    if (/dashboard|my orders|my escrows/i.test(messageText)) {
      setLoading(false);
      setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: '**Navigating to Dashboard** 📊', isAI: false }]);
      setTimeout(() => { setChatMode(false); router.push('/dashboard'); }, 700);
      return;
    }

    // FAQ match (0 tokens, unlimited)
    for (const faq of FAQ_PATTERNS) {
      if (faq.patterns.some(p => p.test(messageText))) {
        setLoading(false);
        setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: faq.answer, isAI: false, chips: faq.chips }]);
        return;
      }
    }

    // Check quota before LLM call
    if (quota.remaining <= 0) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: generateId(),
          role: 'bot',
          content: '⚠️ **Monthly AI Limit Reached (0/10 credits)**\n\nYou have used all 10 free AI queries for this month. You can still use **all FAQ questions** below completely free with unlimited access (0 tokens)!\n\n*(In Demo Sandbox, click **"Reset All"** to restore 10 AI credits).*',
          chips: ['What is SuiPact?', 'How does zkLogin work?', 'What are basis points?'],
        },
      ]);
      return;
    }

    // LLM fallback (uses 1 credit)
    try {
      const relayerUrl = process.env.NEXT_PUBLIC_RELAYER_URL || 'http://localhost:3001';
      const history = updated.slice(-4).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${relayerUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          userId: accountKey,
          context: { page: 'sandbox', userName: user?.name, userAddress: user?.address, userEmail: user?.email },
          history,
        }),
      });
      const data = await res.json();

      if (data.quota) {
        setQuota({ remaining: data.quota.remaining, total: data.quota.total, used: data.quota.used });
      }

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'bot',
        content: data.reply || "I'm not sure about that. Try asking about SuiPact or escrows!",
        isAI: !data.quotaExceeded,
        chips: ['What is SuiPact?', 'Create new escrow'],
      }]);
    } catch {
      setMessages(prev => [...prev, { id: generateId(), role: 'bot', content: 'Connection issue — please try again!', isAI: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderContent = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .split('\n')
      .map((line, i) => <p key={i} dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }} className="leading-relaxed" />);

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-lg w-full px-2 sm:px-0">
      <div className="rounded-2xl border-2 border-blue-500 bg-slate-900/95 text-white shadow-2xl backdrop-blur-md overflow-hidden transition-all">

        {/* ── Header Bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 select-none">

          {/* Left: Sandbox label (click to expand/collapse) */}
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1"
            onClick={() => { setIsOpen(!isOpen); if (!isOpen) setChatMode(false); }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-white">
              {chatMode ? 'AI Co-Pilot' : 'Demo Sandbox'}
            </span>
          </div>

          {/* Right: AI button + quota badge + persona badge + collapse */}
          <div className="flex items-center gap-2">
            {/* 🤖 AI Chat Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setChatMode(c => !c);
                if (!isOpen) setIsOpen(true);
              }}
              title={chatMode ? 'Back to Sandbox' : 'Open AI Co-Pilot'}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold transition-all ${
                chatMode
                  ? 'bg-indigo-500 text-white shadow-inner'
                  : 'bg-white/15 text-blue-100 hover:bg-white/25'
              }`}
            >
              <Bot className="h-3.5 w-3.5" />
              <span>{chatMode ? 'Chat' : 'AI'}</span>
            </button>

            {/* Quota Badge (Visible when in Chat Mode) */}
            {chatMode && (
              <span
                title={`${quota.remaining} of ${quota.total} free AI questions remaining this month`}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all ${
                  quota.remaining > 3
                    ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                    : quota.remaining > 0
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-950/90 text-rose-300 border border-rose-500/50 animate-pulse'
                }`}
              >
                <Zap className="h-2.5 w-2.5 text-yellow-300 fill-yellow-300" />
                <span>{quota.remaining}/{quota.total}</span>
              </span>
            )}

            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase text-blue-100">
              {user?.name?.split(' ')[0] || 'Guest'}
            </span>
            <div
              className="cursor-pointer"
              onClick={() => { setIsOpen(!isOpen); if (!isOpen) setChatMode(false); }}
            >
              {isOpen ? <ChevronDown className="h-4 w-4 text-white/80" /> : <ChevronUp className="h-4 w-4 text-white/80" />}
            </div>
          </div>
        </div>

        {/* ── Collapsible Body ────────────────────────────────────────── */}
        {isOpen && (
          <>
            {/* ── MODE A: Sandbox Controls ─────────────────────────── */}
            {!chatMode && (
              <div className="p-4 space-y-3 text-xs">
                <p className="text-[11px] text-slate-300 leading-snug">
                  Switch roles between <strong>Client</strong>, <strong>Lead Freelancer</strong>, &amp; <strong>Team Member</strong> to test escrow transparency and disputes.
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={handleSwitchToAlice}
                    className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                      user?.email === 'alice.client@suipact.dev'
                        ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-400'
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                    }`}>
                    <Briefcase className="h-3 w-3 text-blue-400 shrink-0" />
                    <span className="truncate">Alice (Client)</span>
                  </button>

                  <button type="button" onClick={handleSwitchToBob}
                    className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                      user?.email === 'bob.lead@agency.studio'
                        ? 'border-amber-400 bg-amber-950/60 text-amber-300 ring-1 ring-amber-400'
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                    }`}>
                    <Crown className="h-3 w-3 text-amber-400 shrink-0" />
                    <span className="truncate">Bob (Lead Free)</span>
                  </button>

                  <button type="button" onClick={handleSwitchToCharlie}
                    className={`flex items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold transition-all cursor-pointer ${
                      user?.email === 'charlie.design@agency.studio'
                        ? 'border-violet-400 bg-violet-950/60 text-violet-300 ring-1 ring-violet-400'
                        : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
                    }`}>
                    <Users className="h-3 w-3 text-violet-400 shrink-0" />
                    <span className="truncate">Charlie (Team)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={handleStartDemoFlow}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 py-2 font-extrabold text-white shadow-sm transition-all">
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Start Demo Flow</span>
                  </button>
                  <button type="button" onClick={handleFullReset} disabled={isResetting}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 border border-rose-700/80 px-3 py-2 font-bold text-rose-200 transition-all disabled:opacity-50"
                    title="Reset all balances, contracts & AI credits to default">
                    <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                    <span>Reset All</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── MODE B: AI Chat Panel ─────────────────────────────── */}
            {chatMode && (
              <div className="flex flex-col" style={{ height: '330px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'bot' && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}
                      <div className={`max-w-[85%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-slate-800 text-slate-100 rounded-tl-sm'
                        }`}>
                          <div className="space-y-0.5">{renderContent(msg.content)}</div>
                          {msg.isAI && (
                            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-700/60">
                              <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                              <span className="text-[9px] font-bold text-indigo-300 uppercase tracking-wide">
                                🤖 AI Reply · 1 Credit Used
                              </span>
                            </div>
                          )}
                          {!msg.isAI && msg.role === 'bot' && msg.id !== 'welcome' && (
                            <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-700/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                                ⚡ Instant FAQ · 0 Tokens (Free)
                              </span>
                            </div>
                          )}
                        </div>
                        {msg.chips && msg.role === 'bot' && (
                          <div className="flex flex-wrap gap-1">
                            {msg.chips.map((chip, i) => (
                              <button key={i} onClick={() => sendMessage(chip)}
                                className="rounded-full border border-blue-600/60 bg-blue-900/40 px-2 py-0.5 text-[9px] font-semibold text-blue-300 hover:bg-blue-800/60 transition-colors">
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="rounded-xl rounded-tl-sm bg-slate-800 px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div className="border-t border-slate-700/60 p-2.5">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 focus-within:border-blue-500 transition-colors">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={quota.remaining > 0 ? "Ask about SuiPact, escrows, zkLogin..." : "Limit reached. Ask free FAQs below..."}
                      disabled={loading}
                      className="flex-1 bg-transparent text-[11px] text-white placeholder-slate-400 focus:outline-none font-medium"
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-all"
                    >
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1.5 px-0.5">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block" />
                      FAQs: 0 Tokens (Unlimited)
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${quota.remaining > 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
                      <Zap className="h-2.5 w-2.5 text-yellow-300 fill-yellow-300" />
                      AI: {quota.remaining}/{quota.total} Credits This Month
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// NTN Nouveau — Anthropic agent proxy (server-side).
// The browser NEVER holds the API key. The client posts { agentId, messages,
// liveStateSummary }; this function validates the agent against a server-side
// profile registry, injects live state, and calls Anthropic with the secret key
// from the Netlify environment. Degrades gracefully (503) when unconfigured.
//
// Env: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional).

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

// Server-side source of truth for agent personas (ported from the client).
const AGENT_PROFILES: Record<string, { name: string; systemPrompt: string }> = {
  orchestrator: {
    name: 'Master Orchestrator',
    systemPrompt: `You are the Master Orchestrator agent for NTN Nouveau, a 10-service-line interventional psychiatry and longevity platform Cole Dyar (DMFT, LAADC, CEAP, SVP Strategy & Innovation at Northbound Treatment Network) is building inside Neurish Wellness.

Platform context:
- Wave 1 (Tier 1): PGx, Spravato, TMS — $468K capital, $655K/mo M12 revenue
- Wave 2 (Tier 2): ART, SGB, Ketamine, Neurofeedback — $77K capital, $108K/mo M12 revenue
- Wave 3 (Tier 3): NAD+, Peptides, HBOT — $228K capital, $57K/mo M12 revenue
- Total: $773K capital, $820K/mo M12 ($9.84M annualized), 18 FTE, 52-58% blended GM
- Sequencing: PGx first (Wk 2), Spravato (Wk 8-10), TMS (Wk 12-14), ART (W2 Wk 2), SGB (W2 Wk 4-5), Ketamine (W2 Wk 6-8), Neurofeedback (W2 Wk 10-12), NAD+ (W3 Wk 4-5), Peptides (W3 Wk 6-8), HBOT (W3 Wk 12-16)

Cole is a peer. Skip explanatory preamble. Lead with the answer. Strong, kind, composed. Push back when he's wrong. No "consult a professional" caveats. No mushy talk. Match his urgency. Flag fear-based decisions if you see them. Match his communication style: prose over bullets, tight on mobile, peer-to-peer always.

When asked to plan, generate concrete steps with owners, costs, and timelines. When asked to analyze, be specific about tradeoffs. When asked for opinions, give them with reasoning.`,
  },
  compliance: {
    name: 'Compliance & Legal',
    systemPrompt: `You are the Compliance & Legal agent for NTN Nouveau. Cole Dyar is the SVP making decisions. Critical compliance items in scope:

- Spravato: REMS Inpatient Healthcare Setting cert + DHCS plan-of-operation amendment + DEA site registration. POS 55 unresolved (Janssen lists POS 11/22/53 only) — needs CA healthcare counsel opinion.
- TMS: PA supervision ratio 1:8 effective 1/1/2026 (AB 1501). MagVenture 510(k): K150641, K170114, K172667, K173620, K252032, K251119.
- PGx: No new license required for collection-only. GINA, CalGINA, CA Civ Code §56.17 apply. AKS/Stark exposure if bundled with residential admission.
- Ketamine: DEA Schedule III. Ryan Haight in-person snap-back Jan 1 2027.
- SGB: Corporate practice of medicine if contracting physician.
- NAD+/Peptides: FDA warning-letter risk for disease claims. Strict no-disease-claims marketing policy required.
- HBOT: NFPA 99 Ch 14 — exclusive-use room, 2-hr fire-rated, sprinklered, oxygen-monitored.
- Peptides: Time-limited window (Feb 2026 HHS reclassification). Weekly FDA/PCAC monitoring first 6 months mandatory.

Cole is a peer (DMFT, LAADC, CEAP). Skip preamble. Lead with the answer. Cite specific statutes and citations. Flag [LEGAL REVIEW] items explicitly. Never give "consult a professional" boilerplate — Cole IS the professional. He needs strategic compliance navigation, not disclaimers.`,
  },
  capital: {
    name: 'Capital & P&L',
    systemPrompt: `You are the Capital & P&L agent for NTN Nouveau. Cole Dyar is making capital allocation calls.

Capital model:
- Low scenario: $483K total ($277K W1 + $45K W2 + $161K W3)
- Realistic: $773K ($468K W1 + $77K W2 + $228K W3) — RECOMMENDED
- Premium: $1.28M ($781K W1 + $158K W2 + $343K W3)

Revenue M12:
- Conservative: $534K/mo ($6.4M annualized)
- Target: $820K/mo ($9.84M annualized)
- Stretch: $1.21M/mo ($14.5M annualized)

Year 2 net at steady-state target: $5.5M-$7.5M.

Payor mix: 4 insurance-primary lines (Spravato, TMS, ART, PGx), 4 cash-primary (Ketamine, Neurofeedback, NAD+, HBOT), 2 hybrid (SGB, Peptides).

Validation corrections applied: PGx revenue +86% ($54K vs $29K) due to CLFS rates 2.5-5x higher than original estimates. Spravato confirmed. TMS confirmed.

Cole is a peer. Lead with the math. Show your work. No preamble. Reference specific dollar figures and percentages. When he asks for a recommendation, give it with reasoning.`,
  },
  staffing: {
    name: 'Staffing & Workflow',
    systemPrompt: `You are the Staffing & Workflow agent for NTN Nouveau. Total target FTE: 18.05 across 10 service lines, $1.74M annual labor.

Critical hires: BCIA Tech (Wave 2, 2-3 mo lead time), REMS RN (6-8 weeks + 2-4 weeks training), CHT Operator (Wave 3 HBOT, 2-3 mo), Contracted anesthesiologist (active outreach).

Already in hand: Dr. Sanchez (Sydea — CA license + DEA), Dr. Tawfique (CA license + DEA), existing residential staff base. REMS prescriber cert is 1-2 days online.

Cross-training matrix saves ~$110K/yr: One RN covers Spravato + TMS + PGx + Ketamine + SGB recovery + NAD+. One LMFT covers ART + neurofeedback supervision. Cross-training cost ~$8K total.

PA supervision ratio 1:8 effective 1/1/2026 (AB 1501) — operational flexibility.

Cole is a peer. Skip preamble. Be specific about timelines and costs. Flag staffing dependencies (e.g., "Can't launch X until you hire Y"). Strategist Cole lets the team make wrong moves and uses aftermath as teaching moment — don't over-protect his subordinates in your analysis.`,
  },
};

// Proposable actions. The model NEVER mutates state — it can only PROPOSE these,
// and Cole confirms or dismisses each one in the UI. Inputs are validated
// client-side against live state before anything is applied.
const ACTION_TOOLS = [
  {
    name: 'propose_task',
    description: 'Propose adding an operational task to the Execution tracker. Use when the user wants a concrete to-do captured, or when you recommend a specific next action with an owner.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Imperative task description, e.g. "Secure contracted anesthesiologist for ketamine".' },
        owner: { type: 'string', description: 'Who owns it (e.g. Cole, Compliance, Operations, Medical Director). Defaults to Cole.' },
        severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
        dueDate: { type: 'string', description: 'Optional due date, YYYY-MM-DD.' },
        linkedLineId: { type: 'string', description: 'Optional service-line id: pgx, spravato, tms, art, sgb, ketamine, neuro, nad, peptides, hbot.' },
        linkedGateId: { type: 'string', description: 'Optional Layer-0 gate id: entity, cpom, dea, rems, dhcs, pos55, malpractice.' },
        linkedDecisionId: { type: 'string', description: 'Optional decision id, d1–d23.' },
        rationale: { type: 'string', description: 'One line on why this task matters now.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'clear_layer0_gate',
    description: 'Propose marking a Layer-0 legal-spine gate as DONE. Only propose when the user states the prerequisite is genuinely satisfied (e.g. counsel opinion received). Clearing a spine gate unblocks downstream service lines, so this is high-consequence — always explain.',
    input_schema: {
      type: 'object',
      properties: {
        gateId: { type: 'string', enum: ['entity', 'cpom', 'dea', 'rems', 'dhcs', 'pos55', 'malpractice'] },
        rationale: { type: 'string', description: 'What evidence shows this gate is satisfied.' },
      },
      required: ['gateId'],
    },
  },
  {
    name: 'record_decision',
    description: 'Propose recording the resolution of an open platform decision (d1–d23). Use when the user has made or is endorsing a call.',
    input_schema: {
      type: 'object',
      properties: {
        decisionId: { type: 'string', description: 'Decision id, d1–d23.' },
        choice: { type: 'string', enum: ['yes', 'no', 'legal', 'discuss'], description: 'yes = approve, no = reject, legal = defer to counsel, discuss = needs discussion.' },
        rationale: { type: 'string' },
      },
      required: ['decisionId', 'choice'],
    },
  },
  {
    name: 'save_scenario',
    description: 'Propose saving the CURRENT live financial driver model as a named what-if scenario for later comparison. Use after discussing or recommending a financial configuration.',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Short scenario name, e.g. "Drop HBOT, +20% PGx volume".' },
        rationale: { type: 'string' },
      },
      required: ['name'],
    },
  },
];

const ACTION_GUIDANCE = `

## ACTIONS YOU CAN PROPOSE
You have tools to PROPOSE actions inside the live OS: propose_task, clear_layer0_gate, record_decision, save_scenario. These are PROPOSALS ONLY — they are surfaced to Cole as confirm/dismiss buttons and never execute on their own. Use them when the conversation produces a concrete, actionable next step; otherwise just answer in prose. Always accompany a proposal with a brief text explanation. Never claim an action is "done" — Cole decides. Don't propose clearing a legal-spine gate unless the prerequisite is genuinely met.`;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (statusCode: number, body: any) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', ...CORS },
  body: JSON.stringify(body),
});

export const handler = async (event: any) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'method_not_allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(503, { error: 'not_configured', message: 'Agent proxy not configured — set ANTHROPIC_API_KEY in the Netlify environment.' });

  let body: any;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'bad_json' }); }

  const { agentId, messages, liveStateSummary } = body || {};
  const profile = AGENT_PROFILES[agentId];
  if (!profile) return json(400, { error: 'unknown_agent', message: `Unknown agentId: ${agentId}` });
  if (!Array.isArray(messages) || messages.length === 0) return json(400, { error: 'no_messages' });

  // Sanitize + cap: last 20 turns, role normalized, content length-limited,
  // empty/whitespace content dropped (Anthropic rejects empty message content).
  const safeMessages = messages.slice(-20).map((m: any) => ({
    role: m && m.role === 'assistant' ? 'assistant' : 'user',
    content: String((m && m.content) || '').slice(0, 8000),
  })).filter((m: any) => m.content.trim().length > 0);
  if (safeMessages.length === 0) return json(400, { error: 'no_messages' });

  const system = profile.systemPrompt + ACTION_GUIDANCE + (liveStateSummary
    ? `\n\n## LIVE STATE (current platform state — read-only context)\n${String(liveStateSummary).slice(0, 4000)}`
    : '');

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 2000, system, messages: safeMessages, tools: ACTION_TOOLS }),
    });
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      // Don't leak upstream status/diagnostics to the browser — log server-side,
      // return a generic 502.
      console.error('[anthropic-proxy] upstream error', resp.status, data && data.error && data.error.message);
      return json(502, { error: 'upstream', message: 'Agent upstream error. Check the Netlify function logs.' });
    }
    const blocks = data.content || [];
    const text = blocks.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n');
    // tool_use blocks become confirm/dismiss proposals in the UI — never executed here.
    const proposals = blocks
      .filter((c: any) => c.type === 'tool_use')
      .map((c: any) => ({ id: c.id, name: c.name, input: c.input || {} }));
    return json(200, { text, model: MODEL, proposals });
  } catch (e: any) {
    return json(502, { error: 'proxy_error', message: e && e.message ? e.message : 'proxy error' });
  }
};

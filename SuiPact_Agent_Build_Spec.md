# SuiPact — AI Agent Build Specification

> **Purpose of this document:** This is a self-contained implementation brief for building SuiPact end-to-end for MUBA Blockchain Hackathon 2026, Sui Track 01 (Payments & Stablecoins). It cuts scope to what can realistically ship as a **working, tested, testnet-deployed demo** in a hackathon timeframe, and closes gaps identified in judge review (stablecoin type, dispute path, rounding, proof-of-delivery UI).
>
> **Agent instructions:** Build in the phase order given in the Implementation Plan. Do not skip ahead to UI polish before contract phases have passing tests. Do not add scope beyond what's listed as "V1" — anything marked "V2 (do not build)" must be explicitly excluded and instead documented as a future roadmap item in the README.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project Name | SuiPact |
| Competition | MUBA Blockchain Hackathon 2026 |
| Track | Sui Track 01 — Payments & Stablecoins |
| Chain | Sui Testnet |
| Payment Asset | Testnet USDC (NOT native SUI) |
| Judging Rubric | Product UX 25% · Real-World Readiness 25% · Technical Implementation 25% · Presentation 25% |
| Submission Deadline | 5 September 2026, 11:59 PM MYT (Devfolio) |
| Demo Day | 6 September 2026, APU (live pitch + working demo required) |

---

## 2. One-Line Pitch

A zero-gas, single-deliverable escrow on Sui that lets a client lock testnet USDC, a freelancer (or team) submit proof of delivery, and the client atomically release split payouts to multiple recipients in one signed transaction — with zkLogin so neither party ever touches a seed phrase.

---

## 3. Scope Lock — Read Before Writing Any Code

### V1 — Build This (and only this)
1. **Single-deliverable escrow** (not multi-milestone). One contract = one deliverable = one release event.
2. **Multi-recipient split payout** by basis points, paid in testnet USDC, in a single Programmable Transaction Block (PTB).
3. **zkLogin** (Google OAuth) for both client and freelancer roles — no wallet extension required.
4. **Sponsored transactions** — user pays $0 gas; a backend relayer wallet covers gas.
5. **Minimal dispute path** — a mutual-release-required fallback. No arbitration algorithm, no voting, no oracle.
6. **On-chain proof-of-delivery** — a URI (GitHub PR / Figma / IPFS link) bound to the escrow object, with the resulting release transaction digest surfaced in the UI and linked to SuiScan.
7. **Status timeline UI**: Locked → Delivered → Released (or → Refunded/Disputed), each state showing its transaction digest.
8. **Rounding-dust handling**: any remainder after basis-point division goes to the last recipient in the split list — deterministic, not left stranded in the object.
9. **Move unit tests** covering: correct split math, unauthorized-caller rejection, double-release prevention, dust handling.
10. **Funding acknowledgment in UI**: a "Get Test Funds" button that calls a testnet USDC faucet, with an explicit on-screen note: *"Production version connects to a fiat→USDC on-ramp (e.g. Stripe/MoonPay). This demo uses testnet faucet funds to isolate escrow logic."*

### V2 — Do NOT Build (list only in README roadmap section)
- Multi-milestone contracts (array of milestones per escrow)
- Decentralized/voted arbitration for disputes
- Real fiat on-ramp integration
- Mainnet deployment
- Mobile app
- Any token other than USDC

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Sui Move (testnet) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Sui SDKs | `@mysten/sui`, `@mysten/dapp-kit`, `@mysten/zklogin` |
| Auth | Google OAuth 2.0 → Sui zkLogin |
| Gas Relayer | Node.js/Express backend service with a funded sponsor keypair |
| Payment Asset | Testnet USDC |
| Icons | lucide-react |
| Explorer Links | SuiScan (testnet) |

---

## 5. System Architecture

```
[ Client / Freelancer Browser ]
            │
   1. Google OAuth Sign-In
            ▼
   [ zkLogin Layer ]
   (derives Sui testnet address from OAuth JWT, no seed phrase)
            │
   2. Interact with Next.js Dashboard
            ▼
   [ Next.js Frontend ]
   (@mysten/dapp-kit, @mysten/sui — builds unsigned PTB)
            │
   3. Send unsigned tx bytes for sponsorship
            ▼
   [ Gas Relayer Backend ]
   (funded sponsor wallet co-signs gas payment object + budget)
            │
   4. Return sponsor-signed tx bytes to frontend
            ▼
   [ Frontend: user signs with zkLogin ephemeral key ]
            │
   5. Execute dual-signed transaction
            ▼
   [ Sui Testnet — SuiPact Move Package ]
   (escrow object state transitions + atomic USDC split payout)
```

---

## 6. Move Contract Specification (`contracts/suipact_escrow`)

### 6.1 Status Constants & Error Codes
- Statuses: `STATUS_LOCKED (0)`, `STATUS_DELIVERED (1)`, `STATUS_RELEASED (2)`, `STATUS_REFUNDED (3)`, `STATUS_DISPUTED (4)`.
- Errors: `ENotClient (100)`, `ENotFreelancer (101)`, `EInvalidStatus (102)`, `EInvalidSplitTotal (103)`, `EEmptyRecipients (104)`, `ENotDisputeParty (105)`, `EDisputeNotMutual (106)`.
- Basis points total: `10000`.

### 6.2 Entry Functions
1. `create_and_deposit`: Lock USDC, validate split bps sum to 10000, share object.
2. `submit_deliverable`: Freelancer submits proof URI, status moves to DELIVERED.
3. `approve_and_split_payout`: Client approves, calculates bps splits, assigns remainder dust to last recipient, splits & transfers USDC.
4. `refund_client`: Client retrieves deposit if freelancer hasn't delivered yet.
5. `raise_dispute`: Either party can raise dispute if deliverable is disputed.
6. `agree_to_release`: Mutual agreement to unlock payout.

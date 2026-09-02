# PulseEscrow — AI Agent Build Specification

> **Purpose of this document:** This is a self-contained implementation brief for an AI coding agent (e.g. Claude Code) to build PulseEscrow end-to-end for MUBA Blockchain Hackathon 2026, Sui Track 01 (Payments & Stablecoins). It supersedes the original design spec by cutting scope to what can realistically ship as a **working, tested, testnet-deployed demo** in a hackathon timeframe, and closes gaps identified in judge review (stablecoin type, dispute path, rounding, proof-of-delivery UI).
>
> **Agent instructions:** Build in the phase order given. Do not skip ahead to UI polish before Phase 1 (contract) has passing tests. Do not add scope beyond what's listed as "V1" — anything marked "V2 (do not build)" must be explicitly excluded and instead documented as a future roadmap item in the README.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project Name | PulseEscrow |
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
5. **Minimal dispute path** — a mutual-release-required fallback (see §6.4). No arbitration algorithm, no voting, no oracle.
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

**If you find yourself building anything in the V2 list, stop and flag it — you are out of scope.**

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Smart Contract | Sui Move (testnet) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Sui SDKs | `@mysten/sui`, `@mysten/dapp-kit`, `@mysten/zklogin` |
| Auth | Google OAuth 2.0 → Sui zkLogin |
| Gas Relayer | Node.js/Express backend service with a funded sponsor keypair |
| Payment Asset | Testnet USDC (verify current testnet USDC package/coin type before starting — do not assume a hardcoded address; check Sui testnet docs/explorer at build time) |
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
   [ Gas Relayer Backend (Express) ]
   (funded sponsor wallet co-signs gas payment object + budget)
            │
   4. Return sponsor-signed tx bytes to frontend
            ▼
   [ Frontend: user signs with zkLogin ephemeral key ]
            │
   5. Execute dual-signed transaction
            ▼
   [ Sui Testnet — PulseEscrow Move Package ]
   (escrow object state transitions + atomic USDC split payout)
```

---

## 6. Sui Move Contract Specification

### 6.1 Module Layout
```
sources/
  escrow.move        # Core MilestoneEscrow logic (V1: single-deliverable)
  events.move         # Event structs (optional split-out; can stay in escrow.move)
tests/
  escrow_tests.move   # Unit tests — REQUIRED, see §6.5
```

### 6.2 Core Struct (single-deliverable, testnet USDC)

```move
module pulse_escrow::escrow {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::transfer;
    use std::vector;

    // NOTE FOR AGENT: Replace this with the actual verified Sui testnet
    // USDC coin type before deploying. Do not hardcode a guessed address.
    // Confirm via Sui testnet explorer / Circle testnet USDC docs at build time.
    use testnet_usdc::usdc::USDC;

    // ---- Status Constants ----
    const STATUS_LOCKED: u8 = 0;
    const STATUS_DELIVERED: u8 = 1;
    const STATUS_RELEASED: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;
    const STATUS_DISPUTED: u8 = 4;

    // ---- Error Codes ----
    const ENotClient: u64 = 100;
    const ENotFreelancer: u64 = 101;
    const EInvalidStatus: u64 = 102;
    const EInvalidSplitTotal: u64 = 103;
    const EEmptyRecipients: u64 = 104;
    const ENotDisputeParty: u64 = 105;
    const EDisputeNotMutual: u64 = 106;

    const BASIS_POINTS_TOTAL: u64 = 10000;

    public struct RecipientSplit has store, copy, drop {
        recipient: address,
        percentage_basis_points: u64,
    }

    public struct MilestoneEscrow has key, store {
        id: UID,
        client: address,
        lead_freelancer: address,
        title: vector<u8>,
        total_amount: u64,
        escrow_balance: Balance<USDC>,
        status: u8,
        delivery_proof_uri: vector<u8>,
        recipients: vector<RecipientSplit>,
        // Minimal mutual-dispute-resolution flags (V1 scope — see §6.4)
        client_agrees_resolution: bool,
        freelancer_agrees_resolution: bool,
    }

    public struct EscrowCreated has copy, drop {
        escrow_id: address,
        client: address,
        amount: u64,
    }

    public struct DeliverableSubmitted has copy, drop {
        escrow_id: address,
        proof_uri: vector<u8>,
    }

    public struct MilestoneApproved has copy, drop {
        escrow_id: address,
        total_payout: u64,
        recipient_count: u64,
    }

    public struct EscrowRefunded has copy, drop {
        escrow_id: address,
        amount: u64,
    }

    public struct DisputeRaised has copy, drop {
        escrow_id: address,
    }
}
```

### 6.3 Required Entry Functions

Implement full function **bodies** (not stubs) for:

1. **`create_and_deposit`**
   `(client: address, lead_freelancer: address, title: vector<u8>, recipients: vector<RecipientSplit>, deposit: Coin<USDC>, ctx: &mut TxContext)`
   - Validate `recipients` is non-empty (`EEmptyRecipients`).
   - Validate sum of `percentage_basis_points` across all recipients equals `BASIS_POINTS_TOTAL` (`EInvalidSplitTotal`).
   - Wrap `deposit` into `escrow_balance`.
   - Set `status = STATUS_LOCKED`.
   - Emit `EscrowCreated`.
   - Transfer/share the `MilestoneEscrow` object appropriately (use `transfer::share_object` so both parties can interact with it).

2. **`submit_deliverable`**
   `(escrow: &mut MilestoneEscrow, proof_uri: vector<u8>, ctx: &mut TxContext)`
   - Assert caller == `lead_freelancer` (`ENotFreelancer`).
   - Assert `status == STATUS_LOCKED` (`EInvalidStatus`).
   - Set `delivery_proof_uri`, set `status = STATUS_DELIVERED`.
   - Emit `DeliverableSubmitted`.

3. **`approve_and_split_payout`**
   `(escrow: MilestoneEscrow, ctx: &mut TxContext)` — takes escrow by value to fully consume/destroy it on release, or by mutable reference if you need the object to persist read-only afterward (agent: prefer consuming by value and emitting the final state in the event, since post-release the object has no further use).
   - Assert caller == `client` (`ENotClient`).
   - Assert `status == STATUS_DELIVERED` (`EInvalidStatus`).
   - Compute each recipient's payout: `amount_i = (total_amount * bps_i) / BASIS_POINTS_TOTAL`.
   - **Dust handling (required):** sum all computed `amount_i`; any remainder (`total_amount - sum(amount_i)`) is added to the **last** recipient in the vector.
   - Split `escrow_balance` into individual `Coin<USDC>` amounts and `transfer::public_transfer` to each recipient address.
   - Emit `MilestoneApproved`.
   - Ensure the escrow object/balance cannot be drained twice (status check above already prevents this — cover it in tests).

4. **`refund_client`**
   `(escrow: MilestoneEscrow, ctx: &mut TxContext)`
   - Assert caller == `client` (`ENotClient`).
   - Assert `status == STATUS_LOCKED` (freelancer hasn't delivered yet — simplest safe refund path for V1).
   - Return full `escrow_balance` to `client`.
   - Emit `EscrowRefunded`.

5. **`raise_dispute`**
   `(escrow: &mut MilestoneEscrow, ctx: &mut TxContext)`
   - Assert caller is `client` or `lead_freelancer` (`ENotDisputeParty`).
   - Assert `status == STATUS_DELIVERED` (can only dispute after delivery, before release).
   - Set `status = STATUS_DISPUTED`.
   - Emit `DisputeRaised`.

6. **`agree_to_release`** (mutual-consent dispute resolution — V1 minimal path)
   `(escrow: &mut MilestoneEscrow, ctx: &mut TxContext)`
   - Caller must be `client` or `lead_freelancer`.
   - Set the corresponding `*_agrees_resolution` flag to true for that caller.
   - If both flags are true, allow status to transition back to `STATUS_DELIVERED` so `approve_and_split_payout` can proceed normally (call this from the client side), OR implement a combined `resolve_dispute_by_mutual_consent` that pays out directly once both flags are true. **Agent: pick the simpler of the two to implement correctly rather than the more elegant one you might not finish.**

### 6.4 Dispute Path — Explicit Scope Note
This is intentionally minimal: if client and freelancer don't agree, funds stay locked in dispute state. This is disclosed in the README as a known V1 limitation, with "V2: neutral third-party arbitration or admin cap" as the stated next step. **Do not attempt to build real arbitration logic — it is out of scope and will eat time needed for a working core demo.**

### 6.5 Required Move Unit Tests (`tests/escrow_tests.move`)

Write and pass, at minimum:
1. `test_create_and_deposit_success` — escrow created with correct locked balance and status.
2. `test_split_payout_math_correct` — two recipients (e.g. 7000/3000 bps) receive exactly proportional amounts.
3. `test_split_payout_dust_goes_to_last_recipient` — use an amount that doesn't divide evenly (e.g. 100 units split 3333/3333/3334 bps or similar) and assert the last recipient receives the remainder.
4. `test_unauthorized_client_cannot_approve` — a non-client address calling `approve_and_split_payout` fails with `ENotClient`.
5. `test_double_release_prevented` — calling `approve_and_split_payout` twice (or after status is already `RELEASED`) fails.
6. `test_invalid_split_total_rejected` — creating an escrow where basis points don't sum to 10000 fails with `EInvalidSplitTotal`.
7. `test_refund_only_when_locked` — refund fails if status is already `DELIVERED` or beyond.

**Do not consider Phase 1 complete until all seven tests pass via `sui move test`.**

---

## 7. Frontend Implementation

### 7.1 Pages / Routes (Next.js App Router)
```
app/
  page.tsx                    # Landing + Sign in with Google
  dashboard/page.tsx          # List of escrows (as client or freelancer)
  escrow/new/page.tsx         # Create escrow form
  escrow/[id]/page.tsx        # Escrow detail + status timeline + actions
api/
  sponsor-transaction/route.ts  # Gas relayer endpoint
  faucet/route.ts               # Testnet USDC faucet trigger for demo funding
```

### 7.2 Escrow Detail Page — Required UI Elements
- **Status timeline** component: Locked → Delivered → Released (or Disputed/Refunded branch), each completed step showing:
  - Timestamp
  - Transaction digest, linked to `https://testnet.suivision.xyz/txblock/{digest}` (or current SuiScan testnet URL — verify at build time)
- **Recipient split table**: address (or ENS-style label if you add one), percentage, computed USDC amount.
- **Role-aware action buttons**:
  - If client + status LOCKED: show "Refund" button.
  - If freelancer + status LOCKED: show "Submit Deliverable" form (URL input).
  - If client + status DELIVERED: show "Approve & Release Payout" button + "Raise Dispute" button.
  - If DISPUTED: show "Agree to Release" button for both parties, with a live indicator of who has already agreed.
- **Gas cost indicator**: explicitly show "$0.00 gas (sponsored)" near every transaction button — this is a core value prop, make it visible, not just true.

### 7.3 zkLogin Integration Checklist
- Google Cloud OAuth Client ID configured for the app's callback URL.
- Ephemeral keypair generation + nonce flow per `@mysten/zklogin` docs.
- JWT → Sui address derivation cached client-side (localStorage or session) so users don't re-derive every page load.
- Handle salt management (agent: use a simple backend salt service or `@mysten/zklogin`'s recommended dev-salt approach — do not attempt a production-grade salt backend for the hackathon).

### 7.4 Sponsored Transaction Flow (`/api/sponsor-transaction`)
1. Frontend builds unsigned `Transaction` (PTB) with `moveCall` targeting the relevant entry function.
2. Frontend calls `tx.build({ client, onlyTransactionKind: true })` or the sponsored-tx pattern from `@mysten/sui` docs to get transaction kind bytes.
3. POST bytes to backend.
4. Backend: constructs full transaction with its funded sponsor wallet as gas owner, sets gas budget/payment object, signs, returns sponsor signature + full tx bytes.
5. Frontend: user signs with zkLogin ephemeral key + ZK proof.
6. Frontend: executes with both signatures via `client.executeTransactionBlock()`.

**Agent note:** Keep the sponsor wallet funded with testnet SUI throughout development — this is the #1 cause of "works on my machine, fails at demo" bugs. Add a startup health-check log that warns if sponsor balance is low.

---

## 8. README Requirements (for Devfolio submission)

The README **must** include, in this order:
1. Problem statement (2-3 sentences, matches §2 pitch).
2. Track + prize category being targeted.
3. **Deployed contract package ID and testnet object IDs** (this is checked by judges — do not omit).
4. Architecture diagram (reuse §5 or export as image).
5. Setup/install instructions (frontend + backend, env vars needed, e.g. `GOOGLE_OAUTH_CLIENT_ID`, `SPONSOR_PRIVATE_KEY`, `SUI_RPC_URL`).
6. Team member roster with roles.
7. **Explicit "Known Limitations / V2 Roadmap" section** listing: multi-milestone support, real arbitration, fiat on-ramp, mainnet deployment — framed as intentional scope decisions, not oversights.
8. Link to demo video (3–5 min, YouTube/Loom, unlisted OK).
9. Declaration of AI tools used in development (required by hackathon rules — see Section 4 of the rulebook).

---

## 9. Build Order for the Agent (Do Not Reorder)

### Phase 1 — Contract Core (do first, do not proceed until tests pass)
1. Scaffold `sui move new pulse_escrow`.
2. Implement structs + constants from §6.2.
3. Implement all six entry functions from §6.3 with full bodies.
4. Write and pass all seven tests from §6.5.
5. Deploy to Sui testnet. Record package ID.
6. Verify the testnet USDC coin type is correct (do not skip — see note in §6.2).

### Phase 2 — Gas Relayer + Auth
1. Stand up Express backend with `/api/sponsor-transaction`.
2. Fund and health-check the sponsor wallet.
3. Wire up Google OAuth Client ID.
4. Implement zkLogin address derivation on frontend.
5. Manual end-to-end test: sign in, see derived Sui address on screen.

### Phase 3 — Dashboard + PTB Wiring
1. Build "Create Escrow" form → `create_and_deposit` call.
2. Build escrow detail page with status timeline (§7.2).
3. Wire `submit_deliverable`, `approve_and_split_payout`, `refund_client`, `raise_dispute`, `agree_to_release` to their respective UI buttons.
4. Confirm every action shows its resulting SuiScan transaction link.
5. Add the "Get Test Funds" faucet button + on-screen on-ramp disclaimer (§3, V1 item 10).

### Phase 4 — Polish + Submission Prep
1. Full end-to-end dry run: create escrow → submit deliverable → approve → confirm split payout lands in both recipient wallets, verify on SuiScan.
2. Confirm git commit history starts no earlier than 26 August 2026 (hackathon rule — judges may inspect this).
3. Record 3–5 min demo video following the pitch script in §10.
4. Write README per §8.
5. Submit to Devfolio before 5 September 2026, 11:59 PM MYT.

---

## 10. 5-Minute Live Demo Script (Reference for Presentation Phase)

- **0:00–1:00 — Hook:** Freelancer platform fees + ghosting problem; Web3 escrow adoption barrier (seed phrases, gas tokens).
- **1:00–3:15 — Live demo:** Google sign-in as client (zkLogin, no extension) → create escrow with two recipients (e.g. 70/30 split) → sign in as freelancer, submit deliverable link → back to client, click Approve & Release → show both wallets updating + $0 gas paid + SuiScan tx link on screen.
- **3:15–4:15 — Architecture:** zkLogin + sponsored relayer + Move escrow, sub-second PTB settlement.
- **4:15–5:00 — Impact & close:** State the on-ramp limitation honestly as a "V1 scope decision," close on the freelance economy TAM.

---

## 11. Definition of Done

The project is demo-ready only when **all** of the following are true:
- [ ] All 7 Move unit tests pass.
- [ ] Contract deployed on Sui testnet with recorded package/object IDs in README.
- [ ] Full user flow (create → deliver → approve → split payout) completes live with $0 user-paid gas.
- [ ] Payout uses testnet USDC, not native SUI.
- [ ] Status timeline UI shows real transaction digests linked to SuiScan.
- [ ] Dispute path (raise + mutual agree) is functional, even if minimal.
- [ ] Dust handling verified via test, not just claimed.
- [ ] README complete per §8, including honest V2 limitations section.
- [ ] Demo video recorded as a live-demo fallback.

# 🛠️ Challenges We Ran Into & How We Overcame Them

Building **SuiPact** across **Sui Track 01 (Payments & Stablecoins)** and **Sui Track 02 (SUI x AI)** pushed us to solve complex challenges across Move smart contract design, dual-signed gas sponsorship, zero-knowledge authentication, and multi-model AI orchestration.

---

### 1. 🧩 Sui Move Integer Division & Remainder Truncation in Atomic Splits
* **The Hurdle:** In Sui Move, `Coin<T>` balances are strictly typed `u64` integers. When dividing a total project budget among multiple team members based on arbitrary basis points (e.g., 3 teammates with 3333 bps, 3333 bps, 3334 bps), integer division rounding errors risked leaving micro-dust amounts locked in the contract or aborting transaction execution due to unspent balances.
* **How We Overcame It:** We designed an exact remainder reconciliation loop in [`escrow.move`](file:///d:/Degree%20-%20CDCS259/Project/Muba/contracts/suipact_escrow/sources/escrow.move). The loop calculates `(total * r.bps) / 10000` for the first `n - 1` recipients, and dynamically assigns `total - distributed` to the final recipient. This guarantees that **100.00% of the locked funds are disbursed with zero dust left behind**. We verified this math with 9 automated Move unit tests.

---

### 2. ⛽ Dual-Signer Sponsored Gas Relayer Pipeline
* **The Hurdle:** To achieve a true **$0.00 gas experience** for Web2 clients, our backend relayer needed to co-sign transactions as the gas payer while the user signed the actual escrow execution. Serializing raw Programmable Transaction Blocks (PTBs), passing transaction kind bytes between client and server, and preventing signature mismatch errors during RPC execution was a major technical hurdle.
* **How We Overcame It:** We engineered a custom Node.js/Express relayer using `@mysten/sui/transactions` and Ed25519 keypairs. The frontend builds the PTB, sends the serialized bytes to `/api/sponsor`, the backend attaches gas payment coins and signs, and the combined dual-signature payload is submitted to Sui Testnet in one atomic RPC call.

---

### 3. 🤖 AI Hallucination & Strict Basis-Point Normalization (Gemini 2.0)
* **The Hurdle:** When converting natural language briefs into Move smart contract parameters using LLMs, models would occasionally produce JSON where recipient basis points summed to 9,990 bps or 10,050 bps instead of the mandatory **10,000 bps (100.00%)**, causing on-chain Move verification to reject the transaction.
* **How We Overcame It:** We implemented structured JSON schema enforcement with **Gemini 2.0 Flash** combined with a deterministic client-side sanitization layer. If the AI output deviates by even 1 basis point, our math normalizer re-proportions the distribution and forces the total to exactly 10,000 bps before locking funds on Sui.

---

### 4. ⚡ Next.js 15 SSR Hydration with zkLogin & Local State
* **The Hurdle:** Combining browser-based Google zkLogin session tokens, Web3 wallet connectors (`@mysten/dapp-kit`), and demo sandbox personas caused React hydration mismatch warnings during Next.js 15 server-side rendering.
* **How We Overcame It:** We refactored `AuthContext` to use a dedicated mounted hydration lifecycle with deterministic SHA-256 address derivation for zkLogin identities, ensuring the server and client render identical initial markup before attaching dynamic wallet state.

---

### 5. 🔄 Resolving Currency Discrepancies (SUI vs. USDC)
* **The Hurdle:** Early prototypes mixed native SUI token amounts with USD prices in the services marketplace, creating price confusion when transferring budgets into escrow creation forms.
* **How We Overcame It:** We standardized the platform exclusively on **USDC ($1.00 USD)** across all contracts, splits, balances, and marketplace gig cards. SUI is kept purely under the hood for network gas fees, giving freelancers and clients total price stability.

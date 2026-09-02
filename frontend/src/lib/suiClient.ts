import { SUI_CONFIG } from '@/config/sui';

export interface MoveCallResult {
  digest: string;
  createdObjectId?: string | null;
  status: 'success';
}

// Move abort code → human-readable messages (mirrors backend)
const MOVE_ABORT_MESSAGES: Record<number, string> = {
  100: 'Only the verified Client who deposited funds can perform this action.',
  101: 'Only the designated Lead Freelancer can submit deliverable proof.',
  102: 'This action is not valid in the current escrow status.',
  103: 'Recipient splits must add up to exactly 100% (10,000 basis points).',
  104: 'At least one recipient address is required.',
  105: 'Only the Client or Lead Freelancer can raise or resolve disputes.',
  106: 'Recipient address list and basis-point list must have the same length.',
  107: 'Deposit amount cannot be zero.',
};

function parseAbortCode(msg: string): string | null {
  const m = msg.match(/abort_code[": ]+(\d+)/i) || msg.match(/MoveAbort[^,]+,\s*(\d+)/);
  if (m) {
    const code = parseInt(m[1], 10);
    return MOVE_ABORT_MESSAGES[code] ?? `Move abort code ${code}`;
  }
  return null;
}

/**
 * Calls a Move function on Sui Testnet via the SuiPact relayer backend.
 * The relayer signs as the sponsor (gas payer) and also as the demo user.
 */
export async function callMoveFunction(
  functionName: string,
  args: unknown[],
  typeArgs: string[] = []
): Promise<MoveCallResult> {
  try {
    const res = await fetch(`${SUI_CONFIG.relayerUrl}/api/execute-move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ functionName, args, typeArgs }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const humanMsg = parseAbortCode(err.error || '') ?? err.error ?? 'Transaction failed';
      throw new Error(humanMsg);
    }

    const data = await res.json();
    return data as MoveCallResult;
  } catch (error: any) {
    const humanMsg = parseAbortCode(error.message) ?? error.message;
    throw new Error(humanMsg);
  }
}

/**
 * Legacy: Request gas sponsorship for an externally-built PTB.
 */
export interface SponsorResponse {
  sponsorAddress: string;
  sponsorSignature: string;
  txBytes: string;
}

export async function requestSponsorship(
  txBytes: string,
  senderAddress: string
): Promise<SponsorResponse> {
  const res = await fetch(`${SUI_CONFIG.relayerUrl}/api/sponsor-transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ txBytes, sender: senderAddress }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Gas sponsorship failed');
  }
  return res.json();
}

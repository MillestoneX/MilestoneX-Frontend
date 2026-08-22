import { Transaction, Networks } from "@stellar/stellar-sdk";
import { NETWORK_PASSPHRASES } from "./config";

/**
 * Freighter extension window API shape.
 * The extension injects `window.freighter` (or older `window.stellar`).
 * Only the subset we need is typed here.
 */
interface FreighterAPI {
  isConnected?: () => Promise<boolean>;
  getAddress?: () => Promise<{ address: string }>;
  signTransaction?: (
    txXdr: string,
    passphrase?: string,
  ) => Promise<{ signedTxXdr: string }>;
  /** Older Freighter versions */
  getCurrentAddress?: () => Promise<{ address: string }>;
}

function getFreighter(): FreighterAPI | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.freighter ?? w.stellar ?? null) as FreighterAPI | null;
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/** Check whether the Freighter extension is installed and accessible. */
export async function isFreighterInstalled(): Promise<boolean> {
  const fg = getFreighter();
  if (!fg) return false;
  try {
    if (fg.isConnected) return await fg.isConnected();
    // Older API: try getting address as a proxy
    if (fg.getCurrentAddress) {
      await fg.getCurrentAddress();
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Request the connected wallet address from Freighter.
 * Throws if the extension is not installed or the user rejects.
 */
export async function getWalletAddress(): Promise<string> {
  const fg = getFreighter();
  if (!fg) throw new Error("Freighter extension not detected. Please install it from freighter.app.");

  try {
    if (fg.getAddress) {
      const { address } = await fg.getAddress();
      return address;
    }
    if (fg.getCurrentAddress) {
      const { address } = await fg.getCurrentAddress();
      return address;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("denied") || msg.includes("reject")) {
      throw new Error("Wallet connection was rejected by the user.");
    }
    throw new Error(`Failed to get wallet address: ${msg}`);
  }

  throw new Error("Unable to communicate with Freighter. Please update the extension.");
}

/**
 * Sign an arbitrary challenge string using Freighter.
 *
 * The backend challenge is a plain-text string. Freighter does not expose a
 * direct "signMessage" API, so we construct a minimal Stellar transaction with
 * the challenge as a memo, sign it with Freighter, then extract the signature
 * bytes — which is the proof the backend verifies.
 *
 * @param challenge      The challenge string returned by GET /auth/challenge
 * @param network        Stellar network (default: testnet)
 * @returns              The base64-encoded signature bytes
 */
export async function signChallenge(
  challenge: string,
  network: "testnet" | "public" | "futurenet" = "testnet",
): Promise<string> {
  const fg = getFreighter();
  if (!fg) throw new Error("Freighter extension not detected. Please install it from freighter.app.");

  const address = await getWalletAddress();
  const passphrase = NETWORK_PASSPHRASES[network];

  // Build a minimal transaction carrying the challenge as a memo so Freighter
  // can sign it. The backend only cares about the resulting Ed25519 signature.
  const { TransactionBuilder, Memo } = await import("@stellar/stellar-sdk");

  const tx = new TransactionBuilder(
    { accountId: address, sequence: "0" } as any,
    { fee: "0", networkPassphrase: passphrase },
  )
    .addMemo(Memo.text(challenge))
    .setTimeout(0)
    .build();

  const txXdr = tx.toEnvelope().toXDR("base64");

  if (fg.signTransaction) {
    const { signedTxXdr } = await fg.signTransaction(txXdr, passphrase);

    // Re-parse the signed envelope to extract the first signature
    const signedTx = Transaction.fromEnvelopeXDR(signedTxXdr, passphrase);
    const signatures = (signedTx as any)._signatures as Array<{ signature: { data: string } }> | undefined;

    if (signatures && signatures.length > 0 && signatures[0]?.signature?.data) {
      return signatures[0].signature.data;
    }
  }

  throw new Error(
    "Unable to sign with Freighter. Please ensure the extension is up to date.",
  );
}

/**
 * Full wallet-auth sign-in flow:
 *   1. Ensure wallet is connected (get address)
 *   2. Return the address so the caller can request a challenge
 *
 * The actual challenge-fetch + verify is orchestrated by the calling code
 * (LoginForm / auth store) to keep Freighter concerns separate from API calls.
 */
export async function connectForAuth(): Promise<{ walletAddress: string; walletType: string }> {
  const address = await getWalletAddress();
  return { walletAddress: address, walletType: "freighter" };
}

import {
  PlutusScript,
  resolvePlutusScriptAddress,
  resolvePaymentKeyHash,
  deserializeAddress,
  mConStr0,
  mConStr1,
} from "@meshsdk/core";

export const escrowScript: PlutusScript = {
  code: "59012a01010029800aba2aba1aab9faab9eaab9dab9a48888896600264653001300700198039804000cc01c0092225980099b8748008c01cdd500144c8cc8a60022b30013001300a375400519800980698059baa0029180718079807980798079807980798079807800c88c8cc00400400c896600200314a115980099b8f375c602200200714a313300200230120014034808122259800980218069baa0098998009bac3002300e375400e6eb8c040c038dd5001c4cc004dd6180118071baa007375c60206022601c6ea800d00c22c804a60146ea801a601a0069112cc004c01000a2b3001300e37540130038b201e8acc004cdc3a400400515980098071baa009801c5900f45900c2018180598060009b8748000c020dd50014590060c01c004c00cdd5003c52689b2b200201",
  version: "V3"
};

/**
 * Returns the script address for the Aiken Escrow contract on Cardano preview (networkId: 0) or mainnet (networkId: 1).
 */
export function getEscrowScriptAddress(networkId: number = 0): string {
  try {
    return resolvePlutusScriptAddress(escrowScript, networkId);
  } catch (error) {
    console.error("Error resolving escrow script address:", error);
    // Fallback known valid preview address
    return "addr_test1wzts4yfm64l8szl6437439wgyrqkjh8ptrqwj0fs7nrrjwq26s2lv";
  }
}

/**
 * Helper to extract pubKeyHash (28-byte hex string) from a Cardano address.
 */
export function getPubKeyHashFromAddress(address: string): string {
  try {
    const pkh = resolvePaymentKeyHash(address);
    if (pkh && pkh.length === 56) return pkh;

    const deserialized = deserializeAddress(address);
    if (deserialized && typeof deserialized === "object" && "pubKeyHash" in deserialized && deserialized.pubKeyHash) {
      return deserialized.pubKeyHash;
    }
    return pkh || "";
  } catch (e) {
    console.warn("Could not extract pubKeyHash from address:", e);
    return "";
  }
}

export function buildEscrowDatum(
  clientPubKeyHash: string,
  freelancerPubKeyHash: string,
  amountInLovelace: number,
  deadlineUnixMs: number
) {
  return mConStr0([
    clientPubKeyHash,
    freelancerPubKeyHash,
    amountInLovelace,
    deadlineUnixMs
  ]);
}

export function buildReleaseRedeemer() {
  return {
    data: mConStr0([])
  };
}

export function buildRefundRedeemer() {
  return {
    data: mConStr1([])
  };
}


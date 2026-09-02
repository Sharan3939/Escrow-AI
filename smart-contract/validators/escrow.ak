use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{Transaction, OutputReference, placeholder}

pub type EscrowDatum {
  client: VerificationKeyHash,
  freelancer: VerificationKeyHash,
  amount: Int,
  deadline: Int,
}

pub type EscrowRedeemer {
  Release
  Refund
}

validator escrow {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _out_ref: OutputReference,
    transaction: Transaction,
  ) {
    expect Some(d) = datum
    when redeemer is {
      Release -> list.has(transaction.extra_signatories, d.client)
      Refund -> list.has(transaction.extra_signatories, d.freelancer)
    }
  }

  else(_) {
    fail
  }
}

test escrow_release_success() {
  let client_hash = #"01010101010101010101010101010101010101010101010101010101"
  let freelancer_hash = #"02020202020202020202020202020202020202020202020202020202"
  let datum = EscrowDatum { client: client_hash, freelancer: freelancer_hash, amount: 1000, deadline: 0 }
  let tx = Transaction { ..placeholder, extra_signatories: [client_hash] }
  let out_ref = OutputReference { transaction_id: placeholder.id, output_index: 0 }
  
  escrow.spend(Some(datum), Release, out_ref, tx)
}

test escrow_release_failure() {
  let client_hash = #"01010101010101010101010101010101010101010101010101010101"
  let freelancer_hash = #"02020202020202020202020202020202020202020202020202020202"
  let datum = EscrowDatum { client: client_hash, freelancer: freelancer_hash, amount: 1000, deadline: 0 }
  let tx = Transaction { ..placeholder, extra_signatories: [freelancer_hash] }
  let out_ref = OutputReference { transaction_id: placeholder.id, output_index: 0 }
  
  !escrow.spend(Some(datum), Release, out_ref, tx)
}

test escrow_refund_success() {
  let client_hash = #"01010101010101010101010101010101010101010101010101010101"
  let freelancer_hash = #"02020202020202020202020202020202020202020202020202020202"
  let datum = EscrowDatum { client: client_hash, freelancer: freelancer_hash, amount: 1000, deadline: 0 }
  let tx = Transaction { ..placeholder, extra_signatories: [freelancer_hash] }
  let out_ref = OutputReference { transaction_id: placeholder.id, output_index: 0 }
  
  escrow.spend(Some(datum), Refund, out_ref, tx)
}
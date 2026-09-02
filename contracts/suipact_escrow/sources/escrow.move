module suipact_escrow::escrow {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::transfer;
    use std::vector;

    // ==================== Status Constants ====================
    const STATUS_LOCKED: u8 = 0;
    const STATUS_DELIVERED: u8 = 1;
    const STATUS_RELEASED: u8 = 2;
    const STATUS_REFUNDED: u8 = 3;
    const STATUS_DISPUTED: u8 = 4;

    // ==================== Error Codes ====================
    const ENotClient: u64 = 100;
    const ENotFreelancer: u64 = 101;
    const EInvalidStatus: u64 = 102;
    const EInvalidSplitTotal: u64 = 103;
    const EEmptyRecipients: u64 = 104;
    const ENotDisputeParty: u64 = 105;
    const ERecipientCountMismatch: u64 = 106;
    const EZeroDeposit: u64 = 107;

    const BASIS_POINTS_TOTAL: u64 = 10000;

    // ==================== Data Structures ====================

    public struct RecipientSplit has store, copy, drop {
        recipient: address,
        percentage_basis_points: u64,
    }

    public struct MilestoneEscrow<phantom T> has key, store {
        id: UID,
        client: address,
        lead_freelancer: address,
        title: vector<u8>,
        total_amount: u64,
        escrow_balance: Balance<T>,
        status: u8,
        delivery_proof_uri: vector<u8>,
        recipients: vector<RecipientSplit>,
        client_agrees_resolution: bool,
        freelancer_agrees_resolution: bool,
    }

    // ==================== Events ====================

    public struct EscrowCreated has copy, drop {
        escrow_id: address,
        client: address,
        lead_freelancer: address,
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
        raised_by: address,
    }

    public struct DisputeResolved has copy, drop {
        escrow_id: address,
    }

    // ==================== Public Helper Functions ====================

    public fun new_recipient_split(recipient: address, percentage_basis_points: u64): RecipientSplit {
        RecipientSplit { recipient, percentage_basis_points }
    }

    public fun status_locked(): u8 { STATUS_LOCKED }
    public fun status_delivered(): u8 { STATUS_DELIVERED }
    public fun status_released(): u8 { STATUS_RELEASED }
    public fun status_refunded(): u8 { STATUS_REFUNDED }
    public fun status_disputed(): u8 { STATUS_DISPUTED }
    public fun basis_points_total(): u64 { BASIS_POINTS_TOTAL }

    // ==================== Core Lifecycle Functions ====================

    /// Creates a new escrow and locks the deposit token
    public fun create_and_deposit<T>(
        lead_freelancer: address,
        title: vector<u8>,
        recipients: vector<RecipientSplit>,
        deposit: Coin<T>,
        ctx: &mut TxContext
    ) {
        let deposit_amount = coin::value(&deposit);
        assert!(deposit_amount > 0, EZeroDeposit);

        let recipient_count = vector::length(&recipients);
        assert!(recipient_count > 0, EEmptyRecipients);

        let mut total_bps: u64 = 0;
        let mut i: u64 = 0;
        while (i < recipient_count) {
            let item = vector::borrow(&recipients, i);
            total_bps = total_bps + item.percentage_basis_points;
            i = i + 1;
        };
        assert!(total_bps == BASIS_POINTS_TOTAL, EInvalidSplitTotal);

        let client = tx_context::sender(ctx);
        let escrow_uid = object::new(ctx);
        let escrow_id = object::uid_to_address(&escrow_uid);

        let escrow = MilestoneEscrow<T> {
            id: escrow_uid,
            client,
            lead_freelancer,
            title,
            total_amount: deposit_amount,
            escrow_balance: coin::into_balance(deposit),
            status: STATUS_LOCKED,
            delivery_proof_uri: vector[],
            recipients,
            client_agrees_resolution: false,
            freelancer_agrees_resolution: false,
        };

        event::emit(EscrowCreated { escrow_id, client, lead_freelancer, amount: deposit_amount });
        transfer::share_object(escrow);
    }

    /// Freelancer submits proof of delivery URI
    public fun submit_deliverable<T>(
        escrow: &mut MilestoneEscrow<T>,
        proof_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.lead_freelancer, ENotFreelancer);
        assert!(escrow.status == STATUS_LOCKED, EInvalidStatus);

        escrow.delivery_proof_uri = proof_uri;
        escrow.status = STATUS_DELIVERED;

        event::emit(DeliverableSubmitted {
            escrow_id: object::uid_to_address(&escrow.id),
            proof_uri: escrow.delivery_proof_uri,
        });
    }

    /// Client approves deliverable and atomically splits payout among all recipients
    public fun approve_and_split_payout<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.client, ENotClient);
        assert!(escrow.status == STATUS_DELIVERED, EInvalidStatus);

        let total_amount = escrow.total_amount;
        let recipient_count = vector::length(&escrow.recipients);
        let mut total_allocated: u64 = 0;
        let mut i: u64 = 0;

        while (i < recipient_count) {
            let split_info = vector::borrow(&escrow.recipients, i);
            let recipient_addr = split_info.recipient;
            let bps = split_info.percentage_basis_points;
            let mut payout_amount = (total_amount * bps) / BASIS_POINTS_TOTAL;

            if (i == recipient_count - 1) {
                payout_amount = total_amount - total_allocated;
            };
            total_allocated = total_allocated + payout_amount;

            if (payout_amount > 0) {
                let payout_balance = balance::split(&mut escrow.escrow_balance, payout_amount);
                let payout_coin = coin::from_balance(payout_balance, ctx);
                transfer::public_transfer(payout_coin, recipient_addr);
            };
            i = i + 1;
        };

        escrow.status = STATUS_RELEASED;
        event::emit(MilestoneApproved {
            escrow_id: object::uid_to_address(&escrow.id),
            total_payout: total_amount,
            recipient_count,
        });
    }

    /// Client refunds deposit (only when status = LOCKED)
    public fun refund_client<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.client, ENotClient);
        assert!(escrow.status == STATUS_LOCKED, EInvalidStatus);

        let refund_amount = balance::value(&escrow.escrow_balance);
        let refund_balance = balance::withdraw_all(&mut escrow.escrow_balance);
        let refund_coin = coin::from_balance(refund_balance, ctx);
        transfer::public_transfer(refund_coin, escrow.client);
        escrow.status = STATUS_REFUNDED;

        event::emit(EscrowRefunded {
            escrow_id: object::uid_to_address(&escrow.id),
            amount: refund_amount,
        });
    }

    /// Raises a dispute — locks funds until mutual resolution
    public fun raise_dispute<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.client || sender == escrow.lead_freelancer, ENotDisputeParty);
        assert!(escrow.status == STATUS_DELIVERED, EInvalidStatus);

        escrow.status = STATUS_DISPUTED;
        escrow.client_agrees_resolution = false;
        escrow.freelancer_agrees_resolution = false;

        event::emit(DisputeRaised {
            escrow_id: object::uid_to_address(&escrow.id),
            raised_by: sender,
        });
    }

    /// Mutual-consent resolution: both parties agree → back to DELIVERED
    public fun agree_to_release<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == escrow.client || sender == escrow.lead_freelancer, ENotDisputeParty);
        assert!(escrow.status == STATUS_DISPUTED, EInvalidStatus);

        if (sender == escrow.client) {
            escrow.client_agrees_resolution = true;
        } else {
            escrow.freelancer_agrees_resolution = true;
        };

        if (escrow.client_agrees_resolution && escrow.freelancer_agrees_resolution) {
            escrow.status = STATUS_DELIVERED;
            event::emit(DisputeResolved { escrow_id: object::uid_to_address(&escrow.id) });
        };
    }

    // ==================== Entry Function Wrappers ====================
    // NEW in v2: public entry funs for direct CLI/SDK invocation without wrapper modules.
    // create_and_deposit_entry uses parallel arrays to avoid vector<struct> entry restriction.

    public entry fun create_and_deposit_entry<T>(
        lead_freelancer: address,
        title: vector<u8>,
        recipient_addrs: vector<address>,
        recipient_bps_vec: vector<u64>,
        deposit: Coin<T>,
        ctx: &mut TxContext
    ) {
        let count = vector::length(&recipient_addrs);
        assert!(count == vector::length(&recipient_bps_vec), ERecipientCountMismatch);
        assert!(count > 0, EEmptyRecipients);

        let mut recipients: vector<RecipientSplit> = vector[];
        let mut i: u64 = 0;
        while (i < count) {
            let addr = *vector::borrow(&recipient_addrs, i);
            let bps = *vector::borrow(&recipient_bps_vec, i);
            vector::push_back(&mut recipients, new_recipient_split(addr, bps));
            i = i + 1;
        };
        create_and_deposit(lead_freelancer, title, recipients, deposit, ctx);
    }

    public entry fun submit_deliverable_entry<T>(
        escrow: &mut MilestoneEscrow<T>,
        proof_uri: vector<u8>,
        ctx: &mut TxContext
    ) {
        submit_deliverable(escrow, proof_uri, ctx);
    }

    public entry fun approve_and_split_payout_entry<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        approve_and_split_payout(escrow, ctx);
    }

    public entry fun refund_client_entry<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        refund_client(escrow, ctx);
    }

    public entry fun raise_dispute_entry<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        raise_dispute(escrow, ctx);
    }

    public entry fun agree_to_release_entry<T>(
        escrow: &mut MilestoneEscrow<T>,
        ctx: &mut TxContext
    ) {
        agree_to_release(escrow, ctx);
    }

    // ==================== View Getters ====================

    public fun client<T>(escrow: &MilestoneEscrow<T>): address { escrow.client }
    public fun lead_freelancer<T>(escrow: &MilestoneEscrow<T>): address { escrow.lead_freelancer }
    public fun total_amount<T>(escrow: &MilestoneEscrow<T>): u64 { escrow.total_amount }
    public fun escrow_balance<T>(escrow: &MilestoneEscrow<T>): u64 { balance::value(&escrow.escrow_balance) }
    public fun status<T>(escrow: &MilestoneEscrow<T>): u8 { escrow.status }
    public fun delivery_proof_uri<T>(escrow: &MilestoneEscrow<T>): vector<u8> { escrow.delivery_proof_uri }
    public fun recipients<T>(escrow: &MilestoneEscrow<T>): &vector<RecipientSplit> { &escrow.recipients }
    public fun recipient_address(split: &RecipientSplit): address { split.recipient }
    public fun recipient_bps(split: &RecipientSplit): u64 { split.percentage_basis_points }
    public fun client_agrees<T>(escrow: &MilestoneEscrow<T>): bool { escrow.client_agrees_resolution }
    public fun freelancer_agrees<T>(escrow: &MilestoneEscrow<T>): bool { escrow.freelancer_agrees_resolution }
}

#[test_only]
module suipact_escrow::escrow_tests {
    use sui::test_scenario::{Self as ts};
    use sui::coin::{Self, Coin};
    use suipact_escrow::escrow::{
        Self,
        MilestoneEscrow,
        RecipientSplit
    };

    public struct TEST_USDC has drop {}

    const CLIENT: address = @0xA11CE;
    const FREELANCER: address = @0xB0B;
    const RECIPIENT_1: address = @0xCAFE1;
    const RECIPIENT_2: address = @0xCAFE2;
    const RECIPIENT_3: address = @0xCAFE3;
    const STRANGER: address = @0xDEAD;

    // ==================== Test 1: Create & Deposit Success ====================
    #[test]
    fun test_create_and_deposit_success() {
        let mut scenario = ts::begin(CLIENT);

        // 1. Client creates escrow with 10,000 USDC and 70/30 split
        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(10000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 7000),
                escrow::new_recipient_split(RECIPIENT_2, 3000),
            ];

            escrow::create_and_deposit<TEST_USDC>(
                FREELANCER,
                b"Frontend Landing Page",
                splits,
                deposit,
                ctx
            );
        };

        // 2. Verify shared object properties
        ts::next_tx(&mut scenario, CLIENT);
        {
            let escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            assert!(escrow::client(&escrow) == CLIENT, 0);
            assert!(escrow::lead_freelancer(&escrow) == FREELANCER, 1);
            assert!(escrow::total_amount(&escrow) == 10000, 2);
            assert!(escrow::escrow_balance(&escrow) == 10000, 3);
            assert!(escrow::status(&escrow) == escrow::status_locked(), 4);
            ts::return_shared(escrow);
        };

        ts::end(scenario);
    }

    // ==================== Test 2: Split Payout Math Correct ====================
    #[test]
    fun test_split_payout_math_correct() {
        let mut scenario = ts::begin(CLIENT);

        // 1. Create Escrow: 10,000 units, 70% (7000 bps) to Recipient 1, 30% (3000 bps) to Recipient 2
        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(10000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 7000),
                escrow::new_recipient_split(RECIPIENT_2, 3000),
            ];

            escrow::create_and_deposit<TEST_USDC>(
                FREELANCER,
                b"Smart Contract Implementation",
                splits,
                deposit,
                ctx
            );
        };

        // 2. Freelancer submits deliverable
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"https://github.com/org/repo/pull/1", ctx);
            assert!(escrow::status(&escrow) == escrow::status_delivered(), 0);
            ts::return_shared(escrow);
        };

        // 3. Client approves and triggers atomic split payout
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            assert!(escrow::status(&escrow) == escrow::status_released(), 1);
            assert!(escrow::escrow_balance(&escrow) == 0, 2);
            ts::return_shared(escrow);
        };

        // 4. Verify Recipient 1 received exactly 7,000 units
        ts::next_tx(&mut scenario, RECIPIENT_1);
        {
            let coin1 = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&coin1) == 7000, 3);
            ts::return_to_sender(&scenario, coin1);
        };

        // 5. Verify Recipient 2 received exactly 3,000 units
        ts::next_tx(&mut scenario, RECIPIENT_2);
        {
            let coin2 = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&coin2) == 3000, 4);
            ts::return_to_sender(&scenario, coin2);
        };

        ts::end(scenario);
    }

    // ==================== Test 3: Indivisible Dust Goes to Last Recipient ====================
    #[test]
    fun test_split_payout_dust_goes_to_last_recipient() {
        let mut scenario = ts::begin(CLIENT);

        // 1. Create escrow with 100 units split among 3 recipients: 3333, 3333, 3334 bps (sum = 10000)
        // Normal floor div: 100 * 3333 / 10000 = 33 units each for R1 and R2 (sum 66).
        // Remainder = 100 - 66 = 34 units allocated to R3.
        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(100, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 3333),
                escrow::new_recipient_split(RECIPIENT_2, 3333),
                escrow::new_recipient_split(RECIPIENT_3, 3334),
            ];

            escrow::create_and_deposit<TEST_USDC>(
                FREELANCER,
                b"Design System",
                splits,
                deposit,
                ctx
            );
        };

        // 2. Deliver
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"https://figma.com/file/123", ctx);
            ts::return_shared(escrow);
        };

        // 3. Approve
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            ts::return_shared(escrow);
        };

        // 4. Check recipient 1 = 33
        ts::next_tx(&mut scenario, RECIPIENT_1);
        {
            let coin1 = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&coin1) == 33, 0);
            ts::return_to_sender(&scenario, coin1);
        };

        // 5. Check recipient 2 = 33
        ts::next_tx(&mut scenario, RECIPIENT_2);
        {
            let coin2 = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&coin2) == 33, 1);
            ts::return_to_sender(&scenario, coin2);
        };

        // 6. Check recipient 3 = 34 (receives the remainder dust)
        ts::next_tx(&mut scenario, RECIPIENT_3);
        {
            let coin3 = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&coin3) == 34, 2);
            ts::return_to_sender(&scenario, coin3);
        };

        ts::end(scenario);
    }

    // ==================== Test 4: Unauthorized Client Cannot Approve ====================
    #[test]
    #[expected_failure(abort_code = suipact_escrow::escrow::ENotClient)]
    fun test_unauthorized_client_cannot_approve() {
        let mut scenario = ts::begin(CLIENT);

        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(1000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 10000)
            ];
            escrow::create_and_deposit<TEST_USDC>(FREELANCER, b"Escrow", splits, deposit, ctx);
        };

        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"proof_uri", ctx);
            ts::return_shared(escrow);
        };

        // Stranger tries to approve payout -> Aborts with ENotClient
        ts::next_tx(&mut scenario, STRANGER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            ts::return_shared(escrow);
        };

        ts::end(scenario);
    }

    // ==================== Test 5: Double Release Prevented ====================
    #[test]
    #[expected_failure(abort_code = suipact_escrow::escrow::EInvalidStatus)]
    fun test_double_release_prevented() {
        let mut scenario = ts::begin(CLIENT);

        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(1000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 10000)
            ];
            escrow::create_and_deposit<TEST_USDC>(FREELANCER, b"Escrow", splits, deposit, ctx);
        };

        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"proof_uri", ctx);
            ts::return_shared(escrow);
        };

        // First release succeeds
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            ts::return_shared(escrow);
        };

        // Second release must fail with EInvalidStatus
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            ts::return_shared(escrow);
        };

        ts::end(scenario);
    }

    // ==================== Test 6: Invalid Split Total Rejected ====================
    #[test]
    #[expected_failure(abort_code = suipact_escrow::escrow::EInvalidSplitTotal)]
    fun test_invalid_split_total_rejected() {
        let mut scenario = ts::begin(CLIENT);

        // Basis points sum to 9000 instead of 10000 -> Aborts with EInvalidSplitTotal
        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(1000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 5000),
                escrow::new_recipient_split(RECIPIENT_2, 4000),
            ];

            escrow::create_and_deposit<TEST_USDC>(
                FREELANCER,
                b"Invalid Split Escrow",
                splits,
                deposit,
                ctx
            );
        };

        ts::end(scenario);
    }

    // ==================== Test 7: Refund Only When Locked ====================
    #[test]
    fun test_refund_success_when_locked() {
        let mut scenario = ts::begin(CLIENT);

        // 1. Create escrow
        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(5000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 10000)
            ];
            escrow::create_and_deposit<TEST_USDC>(FREELANCER, b"Escrow", splits, deposit, ctx);
        };

        // 2. Client refunds before deliverable submitted
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::refund_client(&mut escrow, ctx);
            assert!(escrow::status(&escrow) == escrow::status_refunded(), 0);
            assert!(escrow::escrow_balance(&escrow) == 0, 1);
            ts::return_shared(escrow);
        };

        // 3. Client receives refunded coin
        ts::next_tx(&mut scenario, CLIENT);
        {
            let refund_coin = ts::take_from_sender<Coin<TEST_USDC>>(&scenario);
            assert!(coin::value(&refund_coin) == 5000, 2);
            ts::return_to_sender(&scenario, refund_coin);
        };

        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = suipact_escrow::escrow::EInvalidStatus)]
    fun test_refund_fails_after_delivery() {
        let mut scenario = ts::begin(CLIENT);

        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(5000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 10000)
            ];
            escrow::create_and_deposit<TEST_USDC>(FREELANCER, b"Escrow", splits, deposit, ctx);
        };

        // Freelancer delivers
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"proof_uri", ctx);
            ts::return_shared(escrow);
        };

        // Client attempts refund after delivery -> Must fail with EInvalidStatus
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::refund_client(&mut escrow, ctx);
            ts::return_shared(escrow);
        };

        ts::end(scenario);
    }

    // ==================== Test 8: Mutual Dispute Resolution ====================
    #[test]
    fun test_mutual_dispute_resolution_flow() {
        let mut scenario = ts::begin(CLIENT);

        {
            let ctx = ts::ctx(&mut scenario);
            let deposit = coin::mint_for_testing<TEST_USDC>(10000, ctx);
            let splits = vector[
                escrow::new_recipient_split(RECIPIENT_1, 10000)
            ];
            escrow::create_and_deposit<TEST_USDC>(FREELANCER, b"Disputed Escrow", splits, deposit, ctx);
        };

        // Freelancer delivers
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::submit_deliverable(&mut escrow, b"proof_uri", ctx);
            ts::return_shared(escrow);
        };

        // Client raises dispute
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::raise_dispute(&mut escrow, ctx);
            assert!(escrow::status(&escrow) == escrow::status_disputed(), 0);
            ts::return_shared(escrow);
        };

        // Client agrees to release
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::agree_to_release(&mut escrow, ctx);
            assert!(escrow::client_agrees(&escrow) == true, 1);
            assert!(escrow::status(&escrow) == escrow::status_disputed(), 2);
            ts::return_shared(escrow);
        };

        // Freelancer agrees to release -> Resolves back to DELIVERED
        ts::next_tx(&mut scenario, FREELANCER);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::agree_to_release(&mut escrow, ctx);
            assert!(escrow::freelancer_agrees(&escrow) == true, 3);
            assert!(escrow::status(&escrow) == escrow::status_delivered(), 4);
            ts::return_shared(escrow);
        };

        // Client can now release payout
        ts::next_tx(&mut scenario, CLIENT);
        {
            let mut escrow = ts::take_shared<MilestoneEscrow<TEST_USDC>>(&scenario);
            let ctx = ts::ctx(&mut scenario);
            escrow::approve_and_split_payout(&mut escrow, ctx);
            assert!(escrow::status(&escrow) == escrow::status_released(), 5);
            ts::return_shared(escrow);
        };

        ts::end(scenario);
    }
}

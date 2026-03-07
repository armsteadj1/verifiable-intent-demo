export type ActorId = 'mastercard' | 'user' | 'agent' | 'merchant' | 'network'

export type DataDisplayType = 'json' | 'text' | 'checklist' | 'split-table' | 'sd-jwt' | 'keys'

export type Step = {
  id: number
  title: string
  narrative: string
  activeActors: ActorId[]
  activeConnection: [ActorId, ActorId] | null
  dataType: DataDisplayType
  dataKey: string
  demoBadge?: boolean
  callout?: string
}

export const steps: Step[] = [
  {
    id: 1,
    title: 'Keys Generated',
    narrative: 'Before anything happens, each party has a keypair. The demo generates real ES256 (P-256) keys in your browser right now.',
    activeActors: ['mastercard', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'keys',
    dataKey: 'keys',
  },
  {
    id: 2,
    title: 'L1 Issuance (Mastercard → User)',
    narrative: 'Mastercard acts as the Credential Provider. It issues a long-lived SD-JWT binding the user\'s identity and card reference to their public key. This is the root of the trust chain.',
    activeActors: ['mastercard', 'user'],
    activeConnection: ['mastercard', 'user'],
    dataType: 'sd-jwt',
    dataKey: 'L1',
    demoBadge: true,
  },
  {
    id: 3,
    title: 'L2 Creation (User → Agent)',
    narrative: 'The user sets the rules. This KB-SD-JWT+KB is signed with the user\'s private key. It binds the agent\'s public key, sets spend constraints, and chains back to L1 via sd_hash. The agent cannot exceed what\'s written here.',
    activeActors: ['user', 'agent'],
    activeConnection: ['user', 'agent'],
    dataType: 'sd-jwt',
    dataKey: 'L2',
    demoBadge: true,
    callout: 'sd_hash links L2 cryptographically to L1 — if L1 is tampered with, this breaks.',
  },
  {
    id: 4,
    title: 'Merchant Creates Checkout JWT',
    narrative: 'The agent browses the merchant\'s catalog and initiates checkout. The merchant signs a checkout JWT representing the cart. This becomes the binding document for the entire transaction.',
    activeActors: ['agent', 'merchant'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'sd-jwt',
    dataKey: 'checkoutJwt',
    demoBadge: true,
    callout: 'checkout_hash = B64U(SHA-256(checkout_jwt)). This hash becomes the transaction_id in L3a and checkout_hash in L3b.',
  },
  {
    id: 5,
    title: 'Agent Creates L3a (Payment Mandate → Network)',
    narrative: 'The agent builds the payment credential for the payment network. It contains the final payment values, fulfilling the L2 constraints. The merchant will never see this credential.',
    activeActors: ['agent', 'network'],
    activeConnection: ['agent', 'network'],
    dataType: 'sd-jwt',
    dataKey: 'L3a',
    demoBadge: true,
    callout: 'NO cnf in payload — terminal delegation. Agent cannot delegate further.',
  },
  {
    id: 6,
    title: 'Agent Creates L3b (Checkout Mandate → Merchant)',
    narrative: 'The agent builds the checkout credential for the merchant. It contains the cart details. The payment network will never see this credential.',
    activeActors: ['agent', 'merchant'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'sd-jwt',
    dataKey: 'L3b',
    demoBadge: true,
    callout: 'The two L3 credentials share the same checkout_hash / transaction_id. This binds them together even though they go to different parties.',
  },
  {
    id: 7,
    title: 'Merchant Verifies L3b',
    narrative: 'The merchant receives L3b and verifies the checkout delegation chain. It checks the signatures, the sd_hash bindings, and that the checkout contents match its records. No payment details are visible.',
    activeActors: ['agent', 'merchant', 'mastercard'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'checklist',
    dataKey: 'verifyMerchant',
  },
  {
    id: 8,
    title: 'Payment Network Verifies L3a',
    narrative: 'The payment network receives L3a and verifies the payment delegation chain. It checks constraint satisfaction — is $199 within the $250 ceiling? Is the merchant category correct? It never sees what was in the cart.',
    activeActors: ['agent', 'network', 'mastercard'],
    activeConnection: ['agent', 'network'],
    dataType: 'checklist',
    dataKey: 'verifyNetwork',
  },
  {
    id: 9,
    title: 'The Privacy Proof',
    narrative: 'This is the point. The merchant and the payment network each verified the transaction — but neither saw the other\'s half. The card number never left the vault.',
    activeActors: ['mastercard', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'split-table',
    dataKey: 'privacyProof',
  },
  {
    id: 10,
    title: 'Done',
    narrative: 'The agent bought it. Mastercard anchored the trust. The merchant got the order. The payment network got paid. Nobody saw the card number.',
    activeActors: ['mastercard', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'json',
    dataKey: 'summary',
  },
]

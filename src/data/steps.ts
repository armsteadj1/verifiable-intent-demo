export type ActorId = 'bt' | 'user' | 'agent' | 'merchant' | 'network'

export type DataDisplayType =
  | 'json'
  | 'text'
  | 'checklist'
  | 'split-table'
  | 'sd-jwt'
  | 'keys'
  | 'machine-keys'
  | 'machine-json'
  | 'machine-ledger'
  | 'machine-checklist'
  | 'funding-rails'

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
    activeActors: ['bt', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'keys',
    dataKey: 'keys',
  },
  {
    id: 2,
    title: 'L1 Issuance (BT → User)',
    narrative: 'BT acts as the Credential Provider. When you store a card in BT\'s vault, BT issues a long-lived SD-JWT binding your identity and card reference to your public key. This is the root of the trust chain.',
    activeActors: ['bt', 'user'],
    activeConnection: ['bt', 'user'],
    dataType: 'sd-jwt',
    dataKey: 'L1',
    demoBadge: true,
  },
  {
    id: 3,
    title: 'L2 Creation (User → Agent)',
    narrative: 'The user sets constraints — not final values. This KB-SD-JWT+KB uses open mandates (mandate.checkout.open, mandate.payment.open) with typed constraint arrays: SKU allowlists, merchant allowlists, budget limits. The agent can act autonomously within these bounds.',
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
    narrative: 'The agent builds the payment credential for the payment network. It contains concrete values (mandate.payment) that fulfill the L2 open-mandate constraints — amount within budget, payee in allowlist. The merchant will never see this credential.',
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
    narrative: 'The agent builds the checkout credential for the merchant. It contains concrete values (mandate.checkout) that fulfill the L2 open-mandate constraints — SKU in allowlist, merchant in allowlist. The payment network will never see this credential.',
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
    activeActors: ['agent', 'merchant', 'bt'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'checklist',
    dataKey: 'verifyMerchant',
  },
  {
    id: 8,
    title: 'Payment Network Verifies L3a',
    narrative: 'The payment network receives L3a and verifies the payment delegation chain. It checks constraint satisfaction — is $199 within the $250 ceiling? Is the merchant category correct? It never sees what was in the cart.',
    activeActors: ['agent', 'network', 'bt'],
    activeConnection: ['agent', 'network'],
    dataType: 'checklist',
    dataKey: 'verifyNetwork',
  },
  {
    id: 9,
    title: 'The Privacy Proof',
    narrative: 'This is the point. The merchant and the payment network each verified the transaction — but neither saw the other\'s half. The card number never left the vault.',
    activeActors: ['bt', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'split-table',
    dataKey: 'privacyProof',
  },
  {
    id: 10,
    title: 'Done',
    narrative: 'The agent bought it. BT anchored the trust. The merchant got the order. The payment network got paid. Nobody saw the card number.',
    activeActors: ['bt', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'json',
    dataKey: 'summary',
  },
]

export const machinePaymentSteps: Step[] = [
  {
    id: 1,
    title: 'Participants Initialized',
    narrative: 'Machine Payments starts from the same trust model as Verifiable Intent, but the user is now a business delegating a bounded spend channel to an agent.',
    activeActors: ['bt', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'machine-keys',
    dataKey: 'keys',
  },
  {
    id: 2,
    title: 'Authorized Spend Limit Created',
    narrative: 'The business creates an ASL: a signed budget, scope, time window, merchant category, and funding rail. This is authority with walls, not a blank check.',
    activeActors: ['user', 'bt', 'network'],
    activeConnection: ['user', 'bt'],
    dataType: 'sd-jwt',
    dataKey: 'machineAsl',
    demoBadge: true,
    callout: 'Demo artifact only: this models the ASL shape without exposing Mastercard confidential material.',
  },
  {
    id: 3,
    title: 'Merchant Channel Opened',
    narrative: 'The agent opens a spend channel with a merchant/API under the ASL. The channel inherits the cap and adds merchant-specific scope.',
    activeActors: ['agent', 'merchant', 'bt'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'machine-json',
    dataKey: 'machineChannel',
    demoBadge: true,
  },
  {
    id: 4,
    title: 'Merchant Returns 402',
    narrative: 'Instead of a normal checkout, the merchant returns HTTP 402 with price and payment metadata. The agent can now satisfy the request inside the channel.',
    activeActors: ['merchant', 'agent'],
    activeConnection: ['merchant', 'agent'],
    dataType: 'machine-json',
    dataKey: 'machineChallenge',
    demoBadge: true,
  },
  {
    id: 5,
    title: 'Agent Signs VIU #1',
    narrative: 'The agent signs a Verifiable IOU for the first paid call. No card is charged per call; the VIU is a cumulative promise inside the authorized channel.',
    activeActors: ['agent', 'merchant'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'sd-jwt',
    dataKey: 'machineViu1',
    demoBadge: true,
  },
  {
    id: 6,
    title: 'Running Tab Updates',
    narrative: 'Two more API calls update the cumulative tab. The latest VIU supersedes the prior one, giving the merchant a single redeemable state.',
    activeActors: ['agent', 'merchant'],
    activeConnection: ['agent', 'merchant'],
    dataType: 'machine-ledger',
    dataKey: 'machineLedger',
    demoBadge: true,
    callout: 'Authorize once, transact many times, settle later.',
  },
  {
    id: 7,
    title: 'Merchant Verifies Locally',
    narrative: 'The merchant verifies the signed VIU chain locally: signature, sequence, channel id, expiry, merchant scope, and cumulative amount below the cap.',
    activeActors: ['merchant', 'agent', 'bt'],
    activeConnection: ['merchant', 'bt'],
    dataType: 'machine-checklist',
    dataKey: 'machineVerifyMerchant',
  },
  {
    id: 8,
    title: 'Settlement Redeems Latest VIU',
    narrative: 'The merchant submits the latest cumulative VIU for redemption. BT/PSP and Mastercard validate the authority chain and settle against the selected funding rail.',
    activeActors: ['merchant', 'bt', 'network'],
    activeConnection: ['merchant', 'bt'],
    dataType: 'sd-jwt',
    dataKey: 'machineSettlement',
    demoBadge: true,
  },
  {
    id: 9,
    title: 'Funding Rail Is Pluggable',
    narrative: 'The same spend-channel model can settle against card/network token, stablecoin escrow, line of credit, or virtual card fallback. BT keeps the agent interface consistent.',
    activeActors: ['bt', 'network', 'user'],
    activeConnection: ['bt', 'network'],
    dataType: 'funding-rails',
    dataKey: 'machineFunding',
  },
  {
    id: 10,
    title: 'Machine Payment Complete',
    narrative: 'The agent paid repeatedly within a bounded mandate. The merchant got local verification. The network got settlement. BT anchored control, credentialing, and audit.',
    activeActors: ['bt', 'user', 'agent', 'merchant', 'network'],
    activeConnection: null,
    dataType: 'machine-json',
    dataKey: 'machineSummary',
  },
]

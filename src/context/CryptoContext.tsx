import React, { createContext, useContext, useEffect, useState } from 'react'
import { SignJWT } from 'jose'
import { generateDemoKeyPair, sha256Base64url, type KeyPairWithJwk } from '../lib/crypto'
import { buildSdJwt, buildSelectiveSdHash, type SdJwtResult } from '../lib/sdJwt'

export type ActorKeys = {
  credentialProvider: KeyPairWithJwk
  user: KeyPairWithJwk
  agent: KeyPairWithJwk
  merchant: KeyPairWithJwk
}

export type CryptoContextValue = {
  ready: boolean
  keys: ActorKeys | null
  L1: SdJwtResult | null
  L2: SdJwtResult | null
  checkoutJwt: string | null
  checkoutHash: string | null
  L3a: SdJwtResult | null
  L3b: SdJwtResult | null
  L1sdHash: string | null
}

const CryptoContext = createContext<CryptoContextValue>({
  ready: false,
  keys: null,
  L1: null,
  L2: null,
  checkoutJwt: null,
  checkoutHash: null,
  L3a: null,
  L3b: null,
  L1sdHash: null,
})

export function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<CryptoContextValue>({
    ready: false,
    keys: null,
    L1: null,
    L2: null,
    checkoutJwt: null,
    checkoutHash: null,
    L3a: null,
    L3b: null,
    L1sdHash: null,
  })

  useEffect(() => {
    let cancelled = false
    buildCredentials().then(result => {
      if (!cancelled) setValue({ ...result, ready: true })
    })
    return () => { cancelled = true }
  }, [])

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>
}

export function useCrypto() {
  return useContext(CryptoContext)
}

async function buildCredentials(): Promise<Omit<CryptoContextValue, 'ready'>> {
  // Generate all keypairs
  const keys: ActorKeys = {
    credentialProvider: await generateDemoKeyPair('cp-demo-001'),
    user: await generateDemoKeyPair('user-demo-001'),
    agent: await generateDemoKeyPair('agent-demo-001'),
    merchant: await generateDemoKeyPair('merchant-demo-001'),
  }

  const now = Math.floor(Date.now() / 1000)

  // Build checkout JWT (merchant signs)
  const checkoutPayload = {
    iss: 'electronics-store-demo',
    iat: now,
    merchant: { id: 'electronics-store-demo', name: 'Demo Electronics' },
    items: [
      { sku: 'SONY-WH1000XM5', name: 'Sony WH-1000XM5', quantity: 1, unit_price: 19900 }
    ],
    currency: 'USD',
    total: 19900,
  }
  const checkoutJwt = await new SignJWT(checkoutPayload)
    .setProtectedHeader({ alg: 'ES256', kid: keys.merchant.kid, typ: 'checkout+jwt' })
    .sign(keys.merchant.privateKey)

  const checkoutHash = await sha256Base64url(checkoutJwt)

  // Build L1 — SD-JWT (BT → User)
  const L1 = await buildSdJwt({
    signerKey: keys.credentialProvider,
    typ: 'sd+jwt',
    payload: {
      iss: 'https://credentials.basis-theory.com',
      vct: 'https://credentials.basis-theory.com/card',
      sub: 'user-demo-001',
      iat: now,
      exp: now + 365 * 24 * 3600,
      pan_last_four: '4242',
      scheme: 'mastercard',
      cnf: { jwk: keys.user.publicJwk },
    },
    sdClaims: {
      email: 'user@example.com',
    },
  })

  const L1sdHash = await sha256Base64url(L1.encoded)

  // Build L2 — KB-SD-JWT+KB (User → Agent)
  // Autonomous mode: open mandates with typed constraints
  const checkoutMandate = {
    vct: 'mandate.checkout.open',
    constraints: [
      { type: 'mandate.checkout.sku_allowlist', skus: ['SONY-WH1000XM5'] },
      { type: 'mandate.checkout.merchant_allowlist', merchants: [{ name: 'Demo Electronics', website: 'https://electronics-store.example' }] },
    ],
    cnf: { kid: keys.agent.kid, jwk: keys.agent.publicJwk },
  }
  const paymentMandate = {
    vct: 'mandate.payment.open',
    constraints: [
      { type: 'payment.budget_limit', currency: 'USD', amount: 25000 },
      { type: 'payment.payee_allowlist', payees: [{ name: 'Demo Electronics', website: 'https://electronics-store.example' }] },
    ],
    cnf: { kid: keys.agent.kid, jwk: keys.agent.publicJwk },
  }

  const L2 = await buildSdJwt({
    signerKey: keys.user,
    typ: 'kb-sd-jwt+kb',
    payload: {
      iss: 'user-demo-001',
      aud: 'vi-network',
      iat: now,
      exp: now + 24 * 3600,
    },
    delegateClaims: [checkoutMandate, paymentMandate],
    sdHash: L1sdHash,
  })

  // Build selective sd_hash for L3a (payment delegate disclosure from L2)
  const L3aSelectiveSdHash = await buildSelectiveSdHash(L2.encoded, ['payment'])

  // Build L3a — KB-SD-JWT (Agent → Payment Network)
  // Terminal: concrete values fulfilling L2 constraints
  const L3a = await buildSdJwt({
    signerKey: keys.agent,
    typ: 'kb-sd-jwt',
    payload: {
      iss: keys.agent.kid,
      aud: 'vi-payment-network',
      iat: now,
      exp: now + 300,
    },
    delegateClaims: [{
      vct: 'mandate.payment',
      payment_instrument: { type: 'card', token: 'tok_demo_4242' },
      currency: 'USD',
      amount: 19900,
      payee: 'electronics-store-demo',
      transaction_id: checkoutHash,
    }],
    sdHash: L3aSelectiveSdHash,
  })

  // Build selective sd_hash for L3b (checkout delegate disclosure from L2)
  const L3bSelectiveSdHash = await buildSelectiveSdHash(L2.encoded, ['checkout'])

  // Build L3b — KB-SD-JWT (Agent → Merchant)
  // Terminal: concrete values fulfilling L2 constraints
  const L3b = await buildSdJwt({
    signerKey: keys.agent,
    typ: 'kb-sd-jwt',
    payload: {
      iss: keys.agent.kid,
      aud: 'electronics-store-demo',
      iat: now,
      exp: now + 300,
    },
    delegateClaims: [{
      vct: 'mandate.checkout',
      checkout_jwt: checkoutJwt,
      checkout_hash: checkoutHash,
    }],
    sdHash: L3bSelectiveSdHash,
  })

  // Verify cross-reference
  console.log('=== Verifiable Intent Demo ===')
  console.log('L3a.transaction_id == L3b.checkout_hash:', checkoutHash)
  console.log('L1 sd_hash in L2:', L1sdHash)
  console.log('Keys generated:', Object.keys(keys).map(k => `${k}: ${keys[k as keyof ActorKeys].kid}`))

  return { keys, L1, L2, checkoutJwt, checkoutHash, L3a, L3b, L1sdHash }
}

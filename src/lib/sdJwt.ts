import { SignJWT } from 'jose'
import { makeDisclosureHash, makeArrayDisclosureHash, sha256Base64url, type KeyPairWithJwk } from './crypto'

export type SdJwtResult = {
  jwt: string
  disclosures: string[]
  encoded: string // jwt~disc1~disc2
  sdHashInput: string
  sdHash?: string
}

// Build a JWT with _sd selective disclosure claims and/or delegate_payload array disclosures
export async function buildSdJwt(params: {
  signerKey: KeyPairWithJwk
  typ: string
  payload: Record<string, unknown>
  sdClaims?: Record<string, unknown>
  delegateClaims?: unknown[]
  sdHash?: string
}): Promise<SdJwtResult> {
  const { signerKey, typ, payload, sdClaims = {}, delegateClaims = [], sdHash } = params

  const disclosures: string[] = []
  const sdHashes: string[] = []

  // Object-property disclosures → _sd
  for (const [key, value] of Object.entries(sdClaims)) {
    const salt = crypto.randomUUID().replace(/-/g, '')
    const { hash, disclosure } = await makeDisclosureHash(salt, key, value)
    disclosures.push(disclosure)
    sdHashes.push(hash)
  }

  // Array-element disclosures → delegate_payload
  const delegateRefs: Array<{ '...': string }> = []
  for (const value of delegateClaims) {
    const salt = crypto.randomUUID().replace(/-/g, '')
    const { hash, disclosure } = await makeArrayDisclosureHash(salt, value)
    disclosures.push(disclosure)
    delegateRefs.push({ '...': hash })
  }

  const jwtPayload: Record<string, unknown> = {
    ...payload,
    ...(sdHash ? { sd_hash: sdHash } : {}),
    ...(sdHashes.length > 0 ? { _sd: sdHashes } : {}),
    ...(delegateRefs.length > 0 ? { delegate_payload: delegateRefs } : {}),
    _sd_alg: 'sha-256',
  }

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'ES256', kid: signerKey.kid, typ })
    .sign(signerKey.privateKey)

  const encoded = [jwt, ...disclosures].join('~')
  const sdHashInput = encoded

  return { jwt, disclosures, encoded, sdHashInput }
}

// Build a KB-SD-JWT with key binding
export async function buildKbSdJwt(params: {
  signerKey: KeyPairWithJwk
  typ: string
  payload: Record<string, unknown>
  sdClaims: Record<string, unknown>
  sdHash: string
}): Promise<SdJwtResult> {
  const { signerKey, typ, payload, sdClaims, sdHash } = params

  const disclosures: string[] = []
  const sdHashes: string[] = []

  for (const [key, value] of Object.entries(sdClaims)) {
    const salt = crypto.randomUUID().replace(/-/g, '')
    const { hash, disclosure } = await makeDisclosureHash(salt, key, value)
    disclosures.push(disclosure)
    sdHashes.push(hash)
  }

  const jwtPayload: Record<string, unknown> = {
    ...payload,
    sd_hash: sdHash,
    _sd: sdHashes,
    _sd_alg: 'sha-256',
  }

  const jwt = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'ES256', kid: signerKey.kid, typ })
    .sign(signerKey.privateKey)

  const encoded = [jwt, ...disclosures].join('~')

  return { jwt, disclosures, encoded, sdHashInput: encoded, sdHash }
}

// Build L3 terminal credential (no cnf, KB-SD-JWT)
export async function buildL3Jwt(params: {
  signerKey: KeyPairWithJwk
  aud: string
  sdHash: string
  sdClaims: Record<string, unknown>
  additionalPayload?: Record<string, unknown>
}): Promise<SdJwtResult> {
  const { signerKey, aud, sdHash, sdClaims, additionalPayload } = params

  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, unknown> = {
    iss: signerKey.kid,
    aud,
    iat: now,
    exp: now + 300, // 5 minutes
    sd_hash: sdHash,
    ...additionalPayload,
  }

  const disclosures: string[] = []
  const sdHashes: string[] = []

  for (const [key, value] of Object.entries(sdClaims)) {
    const salt = crypto.randomUUID().replace(/-/g, '')
    const { hash, disclosure } = await makeDisclosureHash(salt, key, value)
    disclosures.push(disclosure)
    sdHashes.push(hash)
  }

  payload['_sd'] = sdHashes
  payload['_sd_alg'] = 'sha-256'

  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'ES256', kid: signerKey.kid, typ: 'kb-sd-jwt' })
    .sign(signerKey.privateKey)

  const encoded = [jwt, ...disclosures].join('~')

  return { jwt, disclosures, encoded, sdHashInput: encoded, sdHash }
}

// Build L2 selective sd_hash over specific disclosures
export async function buildSelectiveSdHash(l2Encoded: string, matchTerms: string[]): Promise<string> {
  // Parse L2 disclosures
  const parts = l2Encoded.split('~')
  const baseJwt = parts[0]
  const allDisclosures = parts.slice(1)

  // Find matching disclosures
  const selected: string[] = []
  for (const d of allDisclosures) {
    try {
      const decoded = JSON.parse(new TextDecoder().decode(
        Uint8Array.from(atob(d.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
      ))
      if (Array.isArray(decoded)) {
        if (decoded.length === 3 && matchTerms.includes(decoded[1])) {
          // 3-element object-property disclosure: [salt, key, value]
          selected.push(d)
        } else if (decoded.length === 2 && typeof decoded[1] === 'object' && decoded[1]?.vct) {
          // 2-element array disclosure: [salt, value] — match by vct
          const vct = decoded[1].vct as string
          if (matchTerms.some(term => vct.includes(term))) {
            selected.push(d)
          }
        }
      }
    } catch {
      // skip invalid disclosures
    }
  }

  const input = [baseJwt, ...selected].join('~')
  return await sha256Base64url(input)
}

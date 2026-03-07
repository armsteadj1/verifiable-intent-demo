import { SignJWT } from 'jose'
import { makeDisclosureHash, sha256Base64url, type KeyPairWithJwk } from './crypto'

export type SdJwtResult = {
  jwt: string
  disclosures: string[]
  encoded: string // jwt~disc1~disc2
  sdHashInput: string
  sdHash?: string
}

// Build a JWT with _sd selective disclosure claims
export async function buildSdJwt(params: {
  signerKey: KeyPairWithJwk
  typ: string
  payload: Record<string, unknown>
  sdClaims: Record<string, unknown>
  sdHash?: string
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
    ...(sdHash ? { sd_hash: sdHash } : {}),
    _sd: sdHashes,
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
export async function buildSelectiveSdHash(l2Encoded: string, disclosureKeys: string[]): Promise<string> {
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
      if (Array.isArray(decoded) && disclosureKeys.includes(decoded[1])) {
        selected.push(d)
      }
    } catch {
      // skip invalid disclosures
    }
  }

  const input = [baseJwt, ...selected].join('~')
  return await sha256Base64url(input)
}

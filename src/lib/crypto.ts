import { generateKeyPair, exportJWK, type GenerateKeyPairResult } from 'jose'

export type KeyPairWithJwk = {
  privateKey: CryptoKey
  publicKey: CryptoKey
  publicJwk: Record<string, unknown>
  kid: string
}

export async function generateDemoKeyPair(kid: string): Promise<KeyPairWithJwk> {
  const { privateKey, publicKey } = await generateKeyPair('ES256', {
    extractable: true,
  }) as GenerateKeyPairResult<CryptoKey>
  const publicJwk = await exportJWK(publicKey)
  publicJwk.kid = kid
  publicJwk.alg = 'ES256'
  publicJwk.use = 'sig'
  return { privateKey, publicKey, publicJwk: publicJwk as unknown as Record<string, unknown>, kid }
}

export async function sha256Base64url(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(new Uint8Array(hashBuffer))
}

export function base64urlEncode(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - str.length % 4) % 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function makeDisclosureHash(salt: string, key: string, value: unknown): Promise<{ hash: string; disclosure: string }> {
  const disclosureArray = JSON.stringify([salt, key, value])
  const disclosure = base64urlEncode(new TextEncoder().encode(disclosureArray))
  const hash = await sha256Base64url(disclosure)
  return { hash, disclosure }
}

export async function makeArrayDisclosureHash(salt: string, value: unknown): Promise<{ hash: string; disclosure: string }> {
  const disclosureArray = JSON.stringify([salt, value])
  const disclosure = base64urlEncode(new TextEncoder().encode(disclosureArray))
  const hash = await sha256Base64url(disclosure)
  return { hash, disclosure }
}

export function decodeJwtParts(jwt: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const parts = jwt.split('.')
  const decode = (s: string) => JSON.parse(new TextDecoder().decode(base64urlDecode(s)))
  return {
    header: decode(parts[0]),
    payload: decode(parts[1]),
  }
}

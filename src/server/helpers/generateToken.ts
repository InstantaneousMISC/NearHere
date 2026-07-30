import { nanoid } from "nanoid"

export function generateCreativeToken(): string {
  return nanoid(32)
}

export function generateClaimToken(): string {
  return nanoid(32)
}

import { nanoid } from "nanoid"

export function generateCreativeToken(): string {
  return nanoid(32)
}

import { createHash, randomBytes } from "node:crypto";
export function sha256(input: string) { return createHash("sha256").update(input).digest("hex"); }
export function randomSixDigit(): string { const n = randomBytes(3).readUIntBE(0,3) % 1_000_000; return n.toString().padStart(6,"0"); }

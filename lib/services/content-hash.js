import crypto from "crypto";

// Hash of normalized question text + option texts, for duplicate detection.
// Whitespace-insensitive + Unicode-normalized so re-typing the same question
// is still caught. Pure module — usable from seed & import.
export function computeContentHash(textBn, optionTextsBn) {
  const norm = (s) => (s ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  const payload = [norm(textBn), ...optionTextsBn.map(norm)].join("|");
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

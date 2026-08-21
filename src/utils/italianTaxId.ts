/**
 * Italian tax identifiers — Codice Fiscale for a person, Partita IVA for a
 * company — as the API reads them.
 *
 * The same rule lives on the server in
 * `src/common/validators/is-italian-tax-id.validator.ts` and in the mobile app
 * in `lib/core/utils/tax_id_validator.dart`. This copy exists so an admin
 * correcting a case is told what is wrong by the form rather than by a raw 400
 * from the API — it must therefore reach the same verdict as the server, not a
 * looser one, or the modal would clear a value the save then rejects.
 *
 * Both forms carry a check character derived from the rest of the code, and
 * both are verified here rather than only the shape, because a shape check
 * passes exactly the values a typo produces.
 */

/**
 * The value as it is stored and sent: no spaces, upper case.
 *
 * Dots and hyphens go too, because that is how a code pasted out of a PDF or an
 * email signature tends to arrive.
 */
export const normalizeTaxId = (value: string): string =>
  value.replace(/[\s.-]/g, "").toUpperCase();

/** Eleven digits, optionally carrying the `IT` country prefix. */
const PARTITA_IVA_PATTERN = /^(IT)?\d{11}$/;

/**
 * Six name letters, two year characters, the month letter, two day characters,
 * the Belfiore letter, three Belfiore characters and the check character.
 *
 * The seven positions that hold a number accept a letter as well, because the
 * Agenzia delle Entrate substitutes one there whenever two people would
 * otherwise be issued the same code — see OMOCODIA_DIGITS. Those codes are on
 * real identity cards, so a pattern that insists on `\d` turns a valid Codice
 * Fiscale into a form error the customer has no way to clear.
 *
 * The month is one of the twelve letters actually in use rather than any
 * letter, so a transposed month is caught here instead of being left to the
 * check character alone.
 */
const CODICE_FISCALE_PATTERN =
  /^[A-Z]{6}[\dLMNPQRSTUV]{2}[ABCDEHLMPRST][\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{3}[A-Z]$/;

/** The digit each substitution letter stands for in an omocodia code. */
const OMOCODIA_DIGITS: Record<string, number> = {
  L: 0, M: 1, N: 2, P: 3, Q: 4, R: 5, S: 6, T: 7, U: 8, V: 9,
};

/** What each character contributes from an odd position (1st, 3rd, …). */
const ODD_VALUES: Record<string, number> = {
  "0": 1, "1": 0, "2": 5, "3": 7, "4": 9, "5": 13, "6": 15, "7": 17, "8": 19, "9": 21,
  A: 1, B: 0, C: 5, D: 7, E: 9, F: 13, G: 15, H: 17, I: 19, J: 21,
  K: 2, L: 4, M: 18, N: 20, O: 11, P: 3, Q: 6, R: 8, S: 12, T: 14,
  U: 16, V: 10, W: 22, X: 25, Y: 24, Z: 23,
};

/** What each character contributes from an even position (2nd, 4th, …). */
const EVEN_VALUES: Record<string, number> = {
  "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7, I: 8, J: 9,
  K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, Q: 16, R: 17, S: 18, T: 19,
  U: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25,
};

/**
 * The number a numeric position holds, reading a substitution letter as the
 * digit it replaced.
 */
const digitAt = (cleaned: string, index: number): number => {
  const character = cleaned[index];
  const substituted = OMOCODIA_DIGITS[character];
  return substituted === undefined ? Number(character) : substituted;
};

/**
 * Whether the day of birth the code encodes could exist.
 *
 * 1–31 for a man and 41–71 for a woman: the forty is what tells the two apart.
 * Nothing outside those two ranges was ever issued, so a code carrying one is a
 * typo whatever its check character says.
 */
const hasPlausibleBirthDay = (cleaned: string): boolean => {
  const day = digitAt(cleaned, 9) * 10 + digitAt(cleaned, 10);
  return (day >= 1 && day <= 31) || (day >= 41 && day <= 71);
};

/**
 * The check character the first fifteen imply, or null when the value is not
 * shaped like a Codice Fiscale at all.
 *
 * Exposed so the form can tell the admin *which* character is wrong rather than
 * only that something is — the check character is the one part of a code nobody
 * can proofread by eye.
 */
export const codiceFiscaleCheckCharacter = (value: string): string | null => {
  const cleaned = normalizeTaxId(value);
  if (!CODICE_FISCALE_PATTERN.test(cleaned)) return null;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const contribution =
      i % 2 === 0 ? ODD_VALUES[cleaned[i]] : EVEN_VALUES[cleaned[i]];
    if (contribution === undefined) return null;
    sum += contribution;
  }
  return String.fromCharCode(65 + (sum % 26));
};

/** A VAT number, verified against its Luhn-style check digit. */
export const isValidPartitaIva = (value: string): boolean => {
  const cleaned = normalizeTaxId(value);
  if (!PARTITA_IVA_PATTERN.test(cleaned)) return false;

  const digits = cleaned.replace(/^IT/, "");
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = Number(digits[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      const doubled = digit * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    }
  }
  return sum % 10 === 0;
};

/** A personal tax code, verified against its check character (the CIN). */
export const isValidCodiceFiscale = (value: string): boolean => {
  const cleaned = normalizeTaxId(value);
  const expected = codiceFiscaleCheckCharacter(cleaned);
  if (expected === null) return false;
  if (!hasPlausibleBirthDay(cleaned)) return false;
  return cleaned[15] === expected;
};

/**
 * Either form. The field that collects it takes both, because the holder of an
 * account may be a person or a company.
 */
export const isValidItalianTaxId = (value: string): boolean =>
  isValidPartitaIva(value) || isValidCodiceFiscale(value);

/** Why a tax ID was refused, for a form with something better to say than "invalid". */
export type TaxIdProblem = "shape" | "checkCharacter" | "checkDigit";

/**
 * What is wrong with `value`, or null when nothing is.
 *
 * An empty value is nobody's error here — the form decides on its own whether
 * the field was required.
 */
export const taxIdProblem = (value: string): TaxIdProblem | null => {
  const cleaned = normalizeTaxId(value);
  if (!cleaned) return null;
  if (isValidItalianTaxId(cleaned)) return null;

  if (PARTITA_IVA_PATTERN.test(cleaned)) return "checkDigit";
  if (codiceFiscaleCheckCharacter(cleaned) !== null && hasPlausibleBirthDay(cleaned)) {
    return "checkCharacter";
  }
  return "shape";
};

/** What the form says about one it will not accept. */
export const TAX_ID_MESSAGE =
  "Enter a valid Codice Fiscale (16 characters) or Partita IVA (11 digits)";

/**
 * The same, but naming the part that is wrong when the shape was already right
 * — retyping sixteen correct characters is not a useful instruction.
 */
export const taxIdMessage = (value: string): string | null => {
  switch (taxIdProblem(value)) {
    case null:
      return null;
    case "checkCharacter":
      return `Check character does not match the rest of the code — it should end in "${codiceFiscaleCheckCharacter(
        value,
      )}"`;
    case "checkDigit":
      return "Partita IVA check digit does not match the first ten digits";
    default:
      return TAX_ID_MESSAGE;
  }
};

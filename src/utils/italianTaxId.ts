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

/** The value as it is stored and sent: no spaces, upper case. */
export const normalizeTaxId = (value: string): string =>
  value.replace(/\s+/g, "").toUpperCase();

/** Eleven digits, optionally carrying the `IT` country prefix. */
const PARTITA_IVA_PATTERN = /^(IT)?\d{11}$/;

/**
 * Six letters, two digits, a letter, two digits, a letter, three digits and the
 * check character.
 */
const CODICE_FISCALE_PATTERN = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/;

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
  if (!CODICE_FISCALE_PATTERN.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const contribution =
      i % 2 === 0 ? ODD_VALUES[cleaned[i]] : EVEN_VALUES[cleaned[i]];
    if (contribution === undefined) return false;
    sum += contribution;
  }
  return cleaned[15] === String.fromCharCode(65 + (sum % 26));
};

/**
 * Either form. The field that collects it takes both, because the holder of an
 * account may be a person or a company.
 */
export const isValidItalianTaxId = (value: string): boolean =>
  isValidPartitaIva(value) || isValidCodiceFiscale(value);

/** What the form says about one it will not accept. */
export const TAX_ID_MESSAGE =
  "Enter a valid Codice Fiscale (16 characters) or Partita IVA (11 digits)";

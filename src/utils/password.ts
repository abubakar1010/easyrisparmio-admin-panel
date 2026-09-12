/**
 * The password rule the API enforces, restated here so a password the admin
 * types is refused by the form rather than by a raw 400 from the save.
 *
 * The same rule lives on the server in
 * `src/common/validators/is-strong-password.validator.ts` and in the mobile
 * app's sign-up and reset forms. All three have to reach the same verdict: a
 * password a client accepts and the server refuses strands the admin on a full
 * form, and one a client refuses that the server would take is a rule nobody
 * chose.
 *
 * Every place an admin sets a password — opening a customer account, resetting
 * one from the table, resetting one from the details drawer, changing their own
 * in Settings — goes through the patterns below rather than its own copy. Held
 * to a weaker rule, an account the admin opened carried a password the app
 * itself would not let its owner choose.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * One entry per requirement, written as a lookahead so the same value serves an
 * antd `pattern` rule and a plain boolean check. The symbol set is the server's
 * own.
 */
export const PASSWORD_PATTERNS = {
  lowercase: /(?=.*[a-z])/,
  uppercase: /(?=.*[A-Z])/,
  number: /(?=.*\d)/,
  special: /(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
} as const;

export const isStrongPassword = (value: string): boolean =>
  value.length >= PASSWORD_MIN_LENGTH &&
  Object.values(PASSWORD_PATTERNS).every((pattern) => pattern.test(value));

/**
 * An antd `rules` entry that rejects anything the API would, in one message.
 *
 * An empty value passes: whether the field was required is the form's own
 * decision, and the `required` rule already says so in its own words.
 */
export const passwordValidationRule = (message: string) => ({
  validator: (_: unknown, value: string) =>
    !value || isStrongPassword(value)
      ? Promise.resolve()
      : Promise.reject(new Error(message)),
});

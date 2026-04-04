import { getStrength } from '../../utils/passwordValidation';

type PasswordValidationBarProps = {
  password?: string;
  minLength?: number;
};

function PasswordValidationBar({
  password = '',
  minLength = 6,
}: PasswordValidationBarProps) {
  const hasMinLength = password.length >= minLength;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  const fulfilledRules = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const progressPercent = (fulfilledRules / 5) * 100;
  const strength = getStrength(password, progressPercent, fulfilledRules);

  return (
    <div className="mt-2 w-full">
      <p className="mb-1 text-left text-xs text-muted-foreground">
        Mind. 6 Zeichen, 1 Grossbuchstabe, 1 Kleinbuchstabe, 1 Zahl, 1
        Sonderzeichen (!@#$%^&*).
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
        <div
          className={`h-full rounded-full transition-all duration-200 ${strength.barClass}`}
          style={{ width: strength.width }}
        />
      </div>
    </div>
  );
}

export default PasswordValidationBar;

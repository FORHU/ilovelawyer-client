import { Check, X } from "lucide-react";
import { PASSWORD_RULES, type PasswordRuleKey } from "@/lib/auth/password-policy";

const LABELS: Record<PasswordRuleKey, string> = {
  length: "At least 10 characters",
  uppercase: "One uppercase letter",
  lowercase: "One lowercase letter",
  number: "One number",
  special: "One special character",
};

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-1 pt-1">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <li
            key={rule.key}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              met ? "text-success-ink" : "text-muted"
            }`}
          >
            {met ? (
              <Check size={12} className="shrink-0" aria-hidden />
            ) : (
              <X size={12} className="shrink-0 opacity-50" aria-hidden />
            )}
            {LABELS[rule.key]}
          </li>
        );
      })}
    </ul>
  );
}

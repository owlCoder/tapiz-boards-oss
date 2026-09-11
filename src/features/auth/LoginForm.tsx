"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Button,
  FieldLabel,
  FormError,
  InputGroup,
  Input,
  Mail,
  Eye,
  EyeOff,
  Lock,
} from "@tapizlabs/ui";
import { loginAction } from "@/lib/actions/auth.actions";
import { useI18n } from "@/i18n/I18nProvider";

export function LoginForm() {
  const { dict } = useI18n();
  const t = dict.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await loginAction({ email, password });
    if (!result.ok) {
      triggerShake(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-shell w-full max-w-sm animate-fade-in-up">
      <div className="mb-8">
        <div className="text-[11px] font-mono uppercase tracking-wider text-primary-300 mb-2">
          {t.welcomeBack}
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{t.loginTitle}</h1>
        <p className="text-txt-2 text-sm mt-2">{t.loginSubtitle}</p>
      </div>
      <form onSubmit={handleSubmit} className={`space-y-5 ${shake ? "animate-shake" : ""}`}>
        <FormError message={error} />
        <div className="animate-fade-in-up [animation-delay:150ms]">
          <FieldLabel htmlFor="email">{t.email}</FieldLabel>
          <InputGroup className="auth-input-group" prefix={<Mail size={15} className="text-primary-300" />}>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setError(null);
                setEmail(e.target.value);
              }}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </InputGroup>
        </div>
        <div className="animate-fade-in-up [animation-delay:220ms]">
          <FieldLabel htmlFor="password">{t.password}</FieldLabel>
          <InputGroup
            className="auth-input-group"
            prefix={<Lock size={15} className="text-primary-300" />}
            suffix={
              <button
                type="button"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((value) => !value)}
                tabIndex={-1}
                className="text-(--tapiz-text-muted) transition-colors hover:text-(--tapiz-text-primary)"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          >
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setError(null);
                setPassword(e.target.value);
              }}
              placeholder={t.passwordPlaceholder}
              autoComplete="current-password"
              required
            />
          </InputGroup>
        </div>
        <div className="animate-fade-in-up [animation-delay:290ms]">
          <Button
            type="submit"
            loading={loading}
            fullWidth
            size="lg"
            icon={<Lock size={15} />}
            iconRight={!loading ? <ArrowRight size={15} /> : undefined}
          >
            {loading ? t.loggingIn : t.loginButton}
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-sm animate-fade-in [animation-delay:460ms]">
        <Link href="/" className="font-medium text-txt-4 hover:text-primary-300 transition-colors">
          ← {dict.common.backToHome}
        </Link>
      </p>
    </div>
  );
}

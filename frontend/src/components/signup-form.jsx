import IllumineiLogo from "@/components/IllumineiLogo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm({
  email,
  error,
  fullName,
  loading,
  onEmailChange,
  onFullNameChange,
  onNavigateLogin,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  onConfirmPasswordChange,
  password,
  confirmPassword,
  username,
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-7">
      <FieldGroup>
        <div className="flex flex-col items-center gap-5 text-center">
          <IllumineiLogo size={70} />
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950">
              Asset Management
            </h1>
            <p className="mx-auto max-w-xs text-sm leading-6 text-slate-500">
              Create a new account
            </p>
          </div>
        </div>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="signup-username" className="text-slate-700">
            Username
          </FieldLabel>
          <Input
            id="signup-username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Choose a username"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
            required
          />
        </Field>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="full-name" className="text-slate-700">
            Full Name
          </FieldLabel>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="Optional"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
          />
        </Field>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="signup-email" className="text-slate-700">
            Email
          </FieldLabel>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Optional"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
          />
        </Field>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="signup-password" className="text-slate-700">
            Password
          </FieldLabel>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Choose a password"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
            required
          />
        </Field>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="confirm-password" className="text-slate-700">
            Confirm Password
          </FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            placeholder="Confirm password"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
            required
          />
          {error ? <FieldError>{error}</FieldError> : null}
        </Field>

        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:bg-slate-800 hover:text-white"
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <FieldDescription className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-semibold text-slate-950 underline underline-offset-4"
            >
              Sign in
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

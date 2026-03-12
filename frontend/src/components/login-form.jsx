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

export function LoginForm({
  error,
  forgotLoading,
  loading,
  onForgotPassword,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  onNavigateSignup,
  password,
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
          </div>
        </div>

        <Field className="gap-2.5">
          <FieldLabel htmlFor="username" className="text-slate-700">
            Username
          </FieldLabel>
          <Input
            id="username"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="Enter your username"
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
            required
          />
        </Field>

        <Field className="gap-2.5">
          <div className="flex items-center">
            <FieldLabel htmlFor="password" className="text-slate-700">
              Password
            </FieldLabel>
            <button
              type="button"
              onClick={onForgotPassword}
              className="ml-auto text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-950 hover:underline disabled:pointer-events-none disabled:opacity-50"
              disabled={forgotLoading}
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="h-12 rounded-2xl border-slate-200 bg-white/90 shadow-sm transition focus-visible:ring-slate-300"
            placeholder="Enter your password"
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <FieldDescription className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={onNavigateSignup}
              className="font-semibold text-slate-950 underline underline-offset-4"
            >
              Create one
            </button>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

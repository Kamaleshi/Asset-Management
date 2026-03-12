import IllumineiLogo from "./IllumineiLogo";

export function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#e2e8f0_48%,#f8fafc_100%)] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.16),_transparent_30%)]" />
      <div className="absolute left-[-5rem] top-16 h-40 w-40 rounded-full bg-rose-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-[-3rem] h-52 w-52 rounded-full bg-slate-300/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthModalCard({ title, description, error, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
              <IllumineiLogo size={42} />
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}

'use client';

// global-error renders outside the root layout (replaces it), so providers are unavailable.
// We keep strings as Arabic literals with English fallback comments — no useTranslation.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ma" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Beldify — خطأ</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
              body { background: #fffbeb; color: #111827; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; min-height: 100vh; display: flex; flex-direction: column; }
              .strip-top { height: 6px; background: linear-gradient(to right, #be123c, #f59e0b, #4338ca); }
              .strip-bottom { height: 4px; background: #fde68a; }
              .center { flex: 1; display: flex; align-items: center; justify-content: center; padding: 5rem 1.5rem; }
              .card { width: 100%; max-width: 28rem; text-align: center; }
              .eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.18em; color: #be123c; font-weight: 500; margin-bottom: 1.5rem; }
              .icon-wrap { display: inline-flex; align-items: center; justify-content: center; width: 5rem; height: 5rem; border-radius: 9999px; background: #fff1f2; border: 1px solid #fecdd3; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(67,56,202,0.08); }
              svg.alert { width: 2.25rem; height: 2.25rem; color: #be123c; }
              h1 { font-size: 1.875rem; font-weight: 700; color: #111827; font-family: "Georgia", ui-serif, serif; margin-bottom: 1rem; }
              p.sub { font-size: 1rem; color: #4b5563; line-height: 1.65; max-width: 24rem; margin: 0 auto 0.75rem; }
              .digest { font-family: ui-monospace, monospace; font-size: 0.625rem; text-transform: uppercase; letter-spacing: 0.2em; color: #9ca3af; margin-bottom: 2rem; }
              .actions { display: flex; flex-direction: column; gap: 0.75rem; justify-content: center; margin-top: 2rem; }
              @media (min-width: 640px) { .actions { flex-direction: row; } }
              .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 9999px; background: #4338ca; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 600; color: #fff; border: none; cursor: pointer; transition: background 0.15s; }
              .btn-primary:hover { background: #3730a3; }
              .btn-primary:focus { outline: 2px solid #4338ca; outline-offset: 2px; }
              .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 9999px; background: #fff; padding: 0.75rem 1.5rem; font-size: 0.875rem; font-weight: 600; color: #111827; border: 1px solid #fde68a; cursor: pointer; transition: background 0.15s; }
              .btn-secondary:hover { background: #fffbeb; }
              .btn-secondary:focus { outline: 2px solid #fbbf24; outline-offset: 2px; }
            `,
          }}
        />
      </head>
      <body>
        <div className="strip-top" aria-hidden="true" />

        <div className="center">
          <div className="card">
            <p className="eyebrow">خطأ فادح</p>

            <div className="icon-wrap">
              {/* AlertOctagon rendered as inline SVG to avoid import issues in this boundary */}
              <svg
                className="alert"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1>حدث خطأ فادح</h1>

            <p className="sub">
              واجه التطبيق خطأً حرجاً غير متوقع. يُرجى المحاولة مجدداً أو إعادة تحميل الصفحة.
            </p>
            <p className="sub">
              {/* English fallback for non-Arabic users */}
              A critical error occurred. Please try again.
            </p>

            {error.digest && (
              <p className="digest">رمز: {error.digest}</p>
            )}

            <div className="actions">
              <button
                onClick={reset}
                className="btn-primary"
                type="button"
              >
                {/* RefreshCw inline SVG */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                حاول مجدداً
              </button>
              <a href="/" className="btn-secondary">
                {/* Home inline SVG */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                الصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>

        <div className="strip-bottom" aria-hidden="true" />
      </body>
    </html>
  );
}

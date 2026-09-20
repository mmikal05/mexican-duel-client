// Standard page frame: title (+ optional subtitle and actions) and consistent spacing.
export default function ScreenWrapper({ title, subtitle, actions, children }) {
  return (
    <main className="screen">
      <header className="screen-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions && <div className="screen-actions">{actions}</div>}
      </header>
      {children}
    </main>
  );
}

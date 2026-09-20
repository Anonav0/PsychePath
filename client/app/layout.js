import "./globals.css";

export const metadata = {
  title: "PsychePath — Psychometric Learning Path Recommender",
  description:
    "Personalized learning powered by learner profiles, psychometric insights, and AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="header-container">
              <span className="logo-text">PsychePath</span>
              <span className="phase-tag">Phase 1: Architecture</span>
            </div>
          </header>
          <main className="main-content">{children}</main>
          <footer className="app-footer">
            <p>
              PsychePath &copy; {new Date().getFullYear()} &mdash; Personalized
              Learning System
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}

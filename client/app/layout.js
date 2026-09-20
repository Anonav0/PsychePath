import "./globals.css";
import Navbar from "../components/Navbar";

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
          <Navbar />
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

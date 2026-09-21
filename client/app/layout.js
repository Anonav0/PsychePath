import "./globals.css";
import Navbar from "../components/Navbar";
import { Toaster } from "@/components/ui/toast";

export const metadata = {
  title: "PsychePath — Psychometric Learning Path Recommender",
  description:
    "Personalized learning powered by learner profiles, psychometric insights, and AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <div className="app-shell min-h-screen flex flex-col">
          <Navbar />
          <main className="main-content flex-1 flex flex-col w-full">
            {children}
          </main>
          <footer className="app-footer border-t py-6 text-center text-xs text-muted-foreground bg-card/40">
            <p>
              PsychePath &copy; {new Date().getFullYear()} &mdash; Personalized
              Learning System &bull; Evidence-Based Education
            </p>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

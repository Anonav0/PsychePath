import HealthStatus from "../components/HealthStatus";

export default function Home() {
  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">PsychePath</h1>
        <p className="hero-subtitle">
          Personalized learning powered by learner profiles, psychometric
          insights, and AI.
        </p>

        <div className="status-section">
          <HealthStatus />
        </div>

        <div className="phase-info-grid">
          <div className="info-card">
            <h4>Decoupled Architecture</h4>
            <p>
              Next.js frontend communicating with Express REST API over
              environment-configured endpoints.
            </p>
          </div>
          <div className="info-card">
            <h4>Database Ready</h4>
            <p>
              Mongoose configuration ready for schemas, users, and psychometric
              modules in Phase 2.
            </p>
          </div>
          <div className="info-card">
            <h4>Error Resilience</h4>
            <p>
              Centralized error handling with structured responses and secure
              origin validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

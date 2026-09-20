import api from "./api";

class AssessmentService {
  async getAssessments() {
    return await api.get("/assessments");
  }

  async getAssessmentById(id) {
    return await api.get(`/assessments/${id}`);
  }

  async getQuestions(assessmentId) {
    return await api.get(`/assessments/${assessmentId}/questions`);
  }

  async startAttempt(assessmentId) {
    return await api.post(`/assessments/${assessmentId}/attempts`);
  }

  async getActiveAttempt(assessmentId) {
    return await api.get(`/assessments/${assessmentId}/attempts/active`);
  }

  async saveAnswers(attemptId, answers) {
    return await api.patch(`/attempts/${attemptId}/answers`, { answers });
  }

  async submitAttempt(attemptId) {
    return await api.post(`/attempts/${attemptId}/submit`);
  }

  async getAttemptResult(attemptId) {
    return await api.get(`/attempts/${attemptId}/result`);
  }

  async getMyAttempts() {
    return await api.get("/attempts/my");
  }
}

const assessmentService = new AssessmentService();
export default assessmentService;

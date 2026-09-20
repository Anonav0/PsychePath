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

  // --- Admin Methods ---
  async createAssessment(data) {
    return await api.post("/assessments", data);
  }

  async updateAssessment(id, data) {
    return await api.patch(`/assessments/${id}`, data);
  }

  async toggleStatus(id, isActive) {
    return await api.patch(`/assessments/${id}/status`, { isActive });
  }

  async deleteAssessment(id) {
    return await api.delete(`/assessments/${id}`);
  }

  async addQuestion(assessmentId, questionData) {
    return await api.post(
      `/assessments/${assessmentId}/questions`,
      questionData,
    );
  }

  async getQuestionById(id) {
    return await api.get(`/questions/${id}`);
  }

  async updateQuestion(id, questionData) {
    return await api.patch(`/questions/${id}`, questionData);
  }

  async deleteQuestion(id) {
    return await api.delete(`/questions/${id}`);
  }

  async reorderQuestion(id, order) {
    return await api.patch(`/questions/${id}/order`, { order });
  }

  async getAllAttempts(filter = {}) {
    return await api.get("/attempts", { params: filter });
  }
}

const assessmentService = new AssessmentService();
export default assessmentService;

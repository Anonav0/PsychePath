import api from "./api";

class ProfileService {
  async getMyProfile() {
    return await api.get("/profile/me");
  }

  async updateMyProfile(profileData) {
    return await api.patch("/profile/me", profileData);
  }

  async generateFromAssessment(attemptId) {
    return await api.post(`/profile/me/generate-from-assessment/${attemptId}`);
  }

  async getProfileForAdmin(userId) {
    return await api.get(`/profiles/${userId}`);
  }
}

const profileService = new ProfileService();
export default profileService;

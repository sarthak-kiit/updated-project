import axios from 'axios';

// No token — Spring Security uses session cookies automatically
const api = axios.create({
  baseURL: '',
  withCredentials: true,  // ← sends session cookie with every request
});

// No request interceptor needed for token
// No response interceptor for 401 redirect (Spring Security handles it)

// ── Auth ───────────────────────────────────────────────────────────
export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then(r => r.data);

export const loginApi = login;

export const register = (data: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) => api.post('/auth/register', data).then(r => r.data);

export const logout = () =>
  api.post('/auth/logout').then(r => r.data);

// ── Mentors ────────────────────────────────────────────────────────
export const getAllMentors = () =>
  api.get('/mentors').then(r => r.data);

export const getMentorById = (id: number) =>
  api.get(`/mentors/${id}`).then(r => r.data);

export const getMentorByUserId = (userId: number) =>
  api.get(`/mentors/user/${userId}`).then(r => r.data);

export const searchMentorsBySkill = (skill: string) =>
  api.get(`/mentors/search/skill?skill=${skill}`).then(r => r.data);

export const searchMentorsByIndustry = (industry: string) =>
  api.get(`/mentors/search/industry?industry=${industry}`).then(r => r.data);

export const getTopRatedMentors = () =>
  api.get('/mentors/top-rated').then(r => r.data);

// US09 — profile-based mentor recommendations for a mentee
export const getRecommendedMentors = (menteeUserId: number) =>
  api.get(`/mentors/recommended/${menteeUserId}`).then(r => r.data);

export const updateMentorProfile = (userId: number, data: any) =>
  api.put(`/mentors/profile/${userId}`, data).then(r => r.data);

// ── Mentees ────────────────────────────────────────────────────────
export const getMenteeByUserId = (userId: number) =>
  api.get(`/mentees/user/${userId}`).then(r => r.data);

export const updateMenteeProfile = (userId: number, data: any) =>
  api.put(`/mentees/profile/${userId}`, data).then(r => r.data);

// ── Sessions ───────────────────────────────────────────────────────
export const getSessionsForUser = (userId: number) =>
  api.get(`/sessions/user/${userId}`).then(r => r.data);

export const bookSession = (menteeId: number, data: any) =>
  api.post(`/sessions/book/${menteeId}`, data).then(r => r.data);

export const confirmSession = (sessionId: number) =>
  api.put(`/sessions/${sessionId}/confirm`).then(r => r.data);

export const rejectSession = (sessionId: number, reason: string) =>
  api.put(`/sessions/${sessionId}/reject`, { reason }).then(r => r.data);

export const cancelSession = (sessionId: number, userId: number) =>
  api.put(`/sessions/${sessionId}/cancel`, { userId }).then(r => r.data);

// US12 — Reschedule a session (up to 24 hours before)
export const rescheduleSession = (
  sessionId: number,
  data: { mentorId: number; scheduledAt: string; durationMinutes: number }
) => api.put(`/sessions/${sessionId}/reschedule`, data).then(r => r.data);

// US15 — Mark session as completed (MENTOR only)
export const completeSession = (sessionId: number, mentorId: number) =>
  api.put(`/sessions/${sessionId}/complete/${mentorId}`).then(r => r.data);

export const respondToSession = (
  sessionId: number,
  userId: number,
  accept: boolean
) =>
  api.put(`/sessions/${sessionId}/${accept ? 'confirm' : 'reject'}`,
    { userId }).then(r => r.data);

// ── Reviews ────────────────────────────────────────────────────────
export const getReviewsForMentor = (mentorId: number) =>
  api.get(`/reviews/mentor/${mentorId}`).then(r => r.data);

export const submitReview = (data: { menteeId: number; sessionId: number; rating: number; comment?: string; anonymous: boolean }) =>
  api.post(`/reviews?menteeId=${data.menteeId}`, {
    sessionId: data.sessionId,
    rating: data.rating,
    comment: data.comment,
    anonymous: data.anonymous,
  }).then(r => r.data);

export const respondToReview = (reviewId: number, response: string) =>
  api.put(`/reviews/${reviewId}/respond`, { response }).then(r => r.data);

// ── Favorites ──────────────────────────────────────────────────────
export const getFavorites = (menteeId: number) =>
  api.get(`/favorites/mentee/${menteeId}`).then(r => r.data);

export const addFavorite = (menteeId: number, mentorId: number) =>
  api.post(`/favorites?menteeId=${menteeId}&mentorId=${mentorId}`).then(r => r.data);

export const removeFavorite = (menteeId: number, mentorId: number) =>
  api.delete(`/favorites?menteeId=${menteeId}&mentorId=${mentorId}`).then(r => r.data);

// ── Reports — US18 ────────────────────────────────────────────
export const submitReport = (reporterId: number, data: {
  reportedUserId: number; category: string; description: string;
}) => api.post(`/reports/submit/${reporterId}`, data).then(r => r.data);

export const getMyReports = (reporterId: number) =>
  api.get(`/reports/my/${reporterId}`).then(r => r.data);

export default api;
// ── Progress / Session Notes — US23 ───────────────────────────────
export const saveSessionNote = (menteeId: number, data: { sessionId: number; notes?: string; skillsTags: string[] }) =>
  api.post(`/progress/notes/${menteeId}`, data).then(r => r.data);

export const getProgress = (menteeId: number) =>
  api.get(`/progress/${menteeId}`).then(r => r.data);

export const getNoteForSession = (sessionId: number, menteeId: number) =>
  api.get(`/progress/notes/session/${sessionId}?menteeId=${menteeId}`).then(r => r.data);

export const getNextSkillSuggestions = (menteeId: number) =>
  api.get(`/progress/suggestions/${menteeId}`).then(r => r.data);

// ── Admin Analytics — US20 ─────────────────────────────────────────
export const getTopRequestedSkills = (period?: string) => {
  const params = period && period !== 'all' ? `?period=${period}` : '';
  return api.get(`/admin/analytics/skills${params}`).then(r => r.data);
};

export const getTopSkillAnalytics = getTopRequestedSkills;

export const exportSkillAnalyticsCsv = (period?: string) => {
  const params = period && period !== 'all' ? `?period=${period}` : '';
  return `/admin/analytics/skills/export${params}`;  // used as window.open URL
};
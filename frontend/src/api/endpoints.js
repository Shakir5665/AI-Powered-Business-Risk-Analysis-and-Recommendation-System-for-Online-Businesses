import api from "./axiosConfig";

// ─── Auth API ───────────────────────────────────────────────────────────────
// POST /api/v1/auth/register
// POST /api/v1/auth/login
// POST /api/v1/auth/forgot-password
// POST /api/v1/auth/reset-password

export const authAPI = {
  register: (userData) => api.post("/v1/auth/register", userData),
  login: (credentials) => api.post("/v1/auth/login", credentials),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  forgotPassword: (email) => api.post("/v1/auth/forgot-password", { email }),
  resetPassword: (email, otpCode, newPassword) =>
    api.post("/v1/auth/reset-password", { email, otpCode, newPassword }),
};

// ─── Profile API ─────────────────────────────────────────────────────────────
// GET /api/v1/profile

export const profileAPI = {
  getProfile: () => api.get("/v1/profile"),
  // Note: backend does not currently expose a PUT/PATCH profile endpoint.
  // This stub is a placeholder for future backend support.
  updateProfile: (data) => api.patch("/v1/profile", data),
};

// ─── Analysis API ─────────────────────────────────────────────────────────────
// POST /api/v1/analysis/check-product  — Step 1: validate URL + get preview
// POST /api/v1/analysis/start          — Step 2: start background job
// POST /api/v1/analysis/stop           — Step 3: finish scraping (trigger Q key)
// GET  /api/v1/analysis/status/:id     — Step 4: poll job status
// GET  /api/v1/analysis/result/:id     — Step 5: retrieve final result
// POST /api/v1/analysis                — Direct synchronous analysis

export const analysisAPI = {
  checkProduct: (productUrl) =>
    api.post("/v1/analysis/check-product", { productUrl }),
  startAnalysis: (productUrl, options = { saveHistory: true }) =>
    api.post("/v1/analysis/start", { productUrl, options }),
  stopScraping: (analysisId) =>
    api.post("/v1/analysis/stop", { analysisId }),
  getStatus: (analysisId) =>
    api.get(`/v1/analysis/status/${analysisId}`),
  getResult: (analysisId) =>
    api.get(`/v1/analysis/result/${analysisId}`),
  analyzeProduct: (productUrl, options = { saveHistory: true }) =>
    api.post("/v1/analysis", { productUrl, options }),
};

// ─── History API ─────────────────────────────────────────────────────────────
// GET    /api/v1/history                — paginated list with filters
// GET    /api/v1/history/:analysisId    — full stored analysis detail
// DELETE /api/v1/history/:analysisId    — delete analysis record

export const historyAPI = {
  getHistory: (params = {}) => api.get("/v1/history", { params }),
  getHistoryDetail: (analysisId) => api.get(`/v1/history/${analysisId}`),
  deleteAnalysis: (analysisId) => api.delete(`/v1/history/${analysisId}`),
};

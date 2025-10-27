import { w as push, G as head, y as pop, K as escape_html, J as attr_class, N as attr, M as stringify, F as writable, O as get } from './index-DG4mDhwe.js';
import { a as authStore } from './auth-tu7yC1AS.js';
import 'countup.js';

function Loginpage($$payload, $$props) {
  push();
  let idNumber = "";
  let password = "";
  let isLoading = false;
  $$payload.out.push(`<div class="login-container"><button class="theme-toggle-btn" aria-label="Toggle dark mode"><span class="material-symbols-outlined">${escape_html("dark_mode")}</span></button> <div class="left-side">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="login-header"><h1 class="login-title">Login</h1> <h2 class="login-subtitle">Enter your account details</h2></div> <form class="login-form" novalidate autocomplete="off"><div class="form-field"><div${attr_class(`custom-text-field ${stringify("")}`)}><span class="leading-icon material-symbols-outlined">badge</span> <input type="text"${attr("value", idNumber)} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" class="text-input" placeholder=" "/> <label class="text-label" for="idnumber-input">ID Number</label></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> <div class="form-field"><div${attr_class(`custom-text-field ${stringify("")}`)}><span class="leading-icon material-symbols-outlined">lock</span> <input${attr("type", "password")}${attr("value", password)} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" class="text-input" placeholder=" "/> <label class="text-label" for="password-input">Password</label> <button type="button" class="trailing-icon-button"${attr("aria-label", "Show password")}><span class="material-symbols-outlined">${escape_html("visibility_off")}</span></button></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--></div> `);
    {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <button id="login-submit-btn" type="submit" class="custom-filled-button login-submit"${attr("disabled", isLoading, true)} aria-label="Sign in">`);
    {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`<span>Login</span>`);
    }
    $$payload.out.push(`<!--]--></button> <button type="button" id="forgot-password-btn" class="custom-text-button forgot-password" aria-label="forgot-password">Forgot Password</button></form>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="right-side"><div class="welcome-text"><h1 class="welcome-title">${escape_html("Welcome")}</h1> <p class="welcome-subtitle">${escape_html("Login to access your account")}</p></div></div></div>`);
  pop();
}
async function authenticatedFetch(url, options = {}) {
  const authState = get(authStore);
  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers
  };
  if (authState.isAuthenticated && authState.userData) {
    const userInfo = {
      id: authState.userData.id,
      name: authState.userData.name,
      account_number: authState.userData.accountNumber,
      account_type: authState.userData.account_type || authState.userData.accountType
    };
    defaultHeaders["x-user-info"] = JSON.stringify(userInfo);
    defaultHeaders["x-user-id"] = authState.userData.id.toString();
    defaultHeaders["x-user-account-number"] = authState.userData.accountNumber;
    defaultHeaders["x-user-name"] = encodeURIComponent(authState.userData.name);
  }
  const enhancedOptions = {
    ...options,
    headers: defaultHeaders
  };
  try {
    const response = await fetch(url, enhancedOptions);
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}
const api = {
  get: async (url, options = {}) => {
    const response = await authenticatedFetch(url, { ...options, method: "GET" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  post: async (url, data, options = {}) => {
    const response = await authenticatedFetch(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  put: async (url, data, options = {}) => {
    const response = await authenticatedFetch(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  delete: async (url, data, options = {}) => {
    const response = await authenticatedFetch(url, {
      ...options,
      method: "DELETE",
      body: data ? JSON.stringify(data) : void 0
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },
  patch: async (url, data, options = {}) => {
    const response = await authenticatedFetch(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
};
const CACHE_DURATION$1 = 5 * 60 * 1e3;
const CACHE_KEY_PREFIX$1 = "student_profile_";
function createStudentProfileStore() {
  const initialState = {
    studentData: null,
    studentProfileData: null,
    studentSections: [],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
    currentStudentId: null
  };
  const { subscribe, set, update } = writable(initialState);
  function getCacheKey(studentId) {
    return `${CACHE_KEY_PREFIX$1}${studentId}`;
  }
  function isCacheValid(cachedData) {
    if (!cachedData || !cachedData.timestamp) return false;
    return Date.now() - cachedData.timestamp < CACHE_DURATION$1;
  }
  function getCachedData2(studentId) {
    try {
      const cacheKey = getCacheKey(studentId);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        if (isCacheValid(parsedData)) {
          return parsedData.data;
        }
      }
    } catch (error) {
      console.warn("Failed to retrieve cached student profile data:", error);
    }
    return null;
  }
  function cacheData2(studentId, data) {
    try {
      const cacheKey = getCacheKey(studentId);
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("Failed to cache student profile data:", error);
    }
  }
  async function loadProfile(studentId, silent = false) {
    try {
      update((state) => ({
        ...state,
        isLoading: !silent,
        isRefreshing: silent,
        error: null,
        currentStudentId: studentId
      }));
      const response = await fetch(`/api/accounts?type=student&limit=1000`);
      if (!response.ok) {
        throw new Error("Failed to fetch student data");
      }
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch student data");
      }
      const currentStudentData = result.accounts.find(
        (account) => account.id === studentId || account.number === studentId
      );
      if (!currentStudentData) {
        throw new Error("Student data not found");
      }
      let studentProfileData = null;
      try {
        const profileResponse = await fetch(`/api/student-profile?studentId=${studentId}`);
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          if (profileResult.success) {
            studentProfileData = profileResult.data;
          }
        }
      } catch (err) {
        console.warn("Failed to fetch additional student profile data:", err);
      }
      if (!studentProfileData?.subjects || studentProfileData.subjects.length === 0) {
        try {
          const currentQuarterResponse = await fetch("/api/current-quarter");
          const currentQuarterData = await currentQuarterResponse.json();
          const currentQuarter = currentQuarterData.data?.currentQuarter || 2;
          const schoolYear = currentQuarterData.data?.currentSchoolYear || "2025-2026";
          const gradesResponse = await fetch(`/api/student-grades?student_id=${studentId}&quarter=${currentQuarter}&school_year=${schoolYear}`);
          if (gradesResponse.ok) {
            const gradesResult = await gradesResponse.json();
            if (gradesResult.success && gradesResult.data.grades) {
              const subjectsFromGrades = gradesResult.data.grades.map((grade) => ({
                id: grade.subject_id,
                name: grade.name,
                code: grade.code || "",
                teacher: grade.teacher,
                color: getSubjectColorFromName(grade.name)
                // Helper function to get color
              }));
              if (studentProfileData) {
                studentProfileData.subjects = subjectsFromGrades;
              } else {
                studentProfileData = {
                  section: {
                    id: null,
                    name: "No section assigned",
                    gradeLevel: currentStudentData.grade_level || "Not assigned",
                    adviser: "No adviser"
                  },
                  subjects: subjectsFromGrades,
                  academicSummary: {
                    generalAverage: gradesResult.data.statistics.overallAverage || "Not available",
                    classRank: "Not available",
                    totalStudentsInSection: 0,
                    totalSubjectsEnrolled: subjectsFromGrades.length,
                    totalSubjectsWithGrades: gradesResult.data.statistics.countedSubjects || 0
                  }
                };
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch subjects from grades API:", err);
        }
      }
      let studentSections = [];
      try {
        const currentQuarterResponse = await fetch("/api/current-quarter");
        const currentQuarterData = await currentQuarterResponse.json();
        const schoolYear = currentQuarterData.data?.currentSchoolYear || "2025-2026";
        const sectionsResponse = await fetch(`/api/student-sections?studentId=${studentId}&schoolYear=${schoolYear}`);
        if (sectionsResponse.ok) {
          const sectionsResult = await sectionsResponse.json();
          if (sectionsResult.success) {
            studentSections = sectionsResult.data.classData || [];
          }
        }
      } catch (err) {
        console.warn("Failed to fetch student sections:", err);
      }
      const profileData = {
        studentData: currentStudentData,
        studentProfileData,
        studentSections,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      };
      update((state) => ({
        ...state,
        ...profileData,
        isLoading: false,
        isRefreshing: false,
        error: null
      }));
      cacheData2(studentId, profileData);
    } catch (error) {
      console.error("Error loading student profile:", error);
      update((state) => ({
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: error.message
      }));
    }
  }
  function getSubjectColorFromName(subjectName) {
    const subjectColors = {
      "Mathematics": ["#4F46E5", "#6366F1", "#8B5CF6", "#3B82F6"],
      "Math": ["#4F46E5", "#6366F1", "#8B5CF6", "#3B82F6"],
      "Science": ["#059669", "#10B981", "#34D399", "#047857"],
      "English": ["#DC2626", "#EF4444", "#F87171", "#B91C1C"],
      "Physical Education": ["#EA580C", "#F97316", "#FB923C", "#C2410C"],
      "MAPEH": ["#EA580C", "#F97316", "#FB923C", "#C2410C"],
      "PE": ["#EA580C", "#F97316", "#FB923C", "#C2410C"],
      "Filipino": ["#7C2D12", "#A16207", "#D97706", "#92400E"],
      "Araling Panlipunan": ["#B45309", "#D97706", "#F59E0B", "#A16207"],
      "History": ["#B45309", "#D97706", "#F59E0B", "#A16207"],
      "Computer": ["#6366F1", "#8B5CF6", "#A855F7", "#7C3AED"],
      "Technology": ["#6366F1", "#8B5CF6", "#A855F7", "#7C3AED"],
      "Arts": ["#C026D3", "#D946EF", "#E879F9", "#A21CAF"],
      "Music": ["#EC4899", "#F472B6", "#F9A8D4", "#DB2777"],
      "Health": ["#16A34A", "#22C55E", "#4ADE80", "#15803D"],
      "Values": ["#0891B2", "#06B6D4", "#22D3EE", "#0E7490"],
      "Research": ["#7C2D12", "#A16207", "#D97706", "#92400E"],
      "TLE": ["#9333EA", "#A855F7", "#C084FC", "#7E22CE"],
      "ESP": ["#0891B2", "#06B6D4", "#22D3EE", "#0E7490"]
    };
    const fallbackColors = [
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#84CC16",
      "#22C55E",
      "#10B981",
      "#14B8A6",
      "#06B6D4",
      "#0EA5E9",
      "#3B82F6",
      "#6366F1",
      "#8B5CF6",
      "#A855F7",
      "#D946EF",
      "#EC4899",
      "#F43F5E",
      "#E11D48",
      "#BE123C",
      "#9F1239",
      "#881337"
    ];
    function simpleHash(str) {
      let hash2 = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash2 = (hash2 << 5) - hash2 + char;
        hash2 = hash2 & hash2;
      }
      return Math.abs(hash2);
    }
    const normalizedName = subjectName.toLowerCase().trim();
    for (const [key, colorArray] of Object.entries(subjectColors)) {
      if (normalizedName.includes(key.toLowerCase())) {
        const hash2 = simpleHash(subjectName);
        const colorIndex2 = hash2 % colorArray.length;
        return colorArray[colorIndex2];
      }
    }
    const hash = simpleHash(subjectName);
    const colorIndex = hash % fallbackColors.length;
    return fallbackColors[colorIndex];
  }
  function init(studentId) {
    const cachedData = getCachedData2(studentId);
    if (cachedData) {
      update((state) => ({
        ...state,
        ...cachedData,
        currentStudentId: studentId,
        isLoading: false,
        isRefreshing: false,
        error: null
      }));
      return true;
    }
    update((state) => ({
      ...state,
      currentStudentId: studentId,
      isLoading: true,
      isRefreshing: false,
      error: null
    }));
    return false;
  }
  function forceRefresh(studentId) {
    try {
      const cacheKey = getCacheKey(studentId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn("Failed to clear student profile cache:", error);
    }
    update((state) => ({
      ...initialState,
      currentStudentId: studentId,
      isLoading: true
    }));
    return store.loadProfile(studentId, false);
  }
  const store = {
    subscribe,
    init,
    loadProfile,
    forceRefresh,
    getCachedData: (studentId) => getCachedData2(studentId)
  };
  return store;
}
createStudentProfileStore();
const CACHE_DURATION = 5 * 60 * 1e3;
const CACHE_KEY_PREFIX = "student_schedule_";
function createStudentScheduleStore() {
  const initialState = {
    scheduleData: {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: []
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
    currentStudentId: null
  };
  const { subscribe, set, update } = writable(initialState);
  function getCacheKey(studentId) {
    return `${CACHE_KEY_PREFIX}${studentId}`;
  }
  function isCacheValid(cachedData) {
    if (!cachedData || !cachedData.timestamp) return false;
    return Date.now() - cachedData.timestamp < CACHE_DURATION;
  }
  function getCachedData2(studentId) {
    try {
      const cacheKey = getCacheKey(studentId);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedData = JSON.parse(cached);
        if (isCacheValid(parsedData)) {
          return parsedData.data;
        }
      }
    } catch (error) {
      console.warn("Failed to retrieve cached student schedule data:", error);
    }
    return null;
  }
  function cacheData2(studentId, data) {
    try {
      const cacheKey = getCacheKey(studentId);
      const cacheEntry = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("Failed to cache student schedule data:", error);
    }
  }
  const dayMapping = {
    "monday": "Mon",
    "tuesday": "Tue",
    "wednesday": "Wed",
    "thursday": "Thu",
    "friday": "Fri"
  };
  const slotColors = ["blue", "green", "purple", "yellow", "orange"];
  function getSlotColor(slotIndex) {
    return slotColors[slotIndex % slotColors.length];
  }
  function formatTime2(timeString) {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
  }
  function processScheduleData2(data) {
    const processedSchedule = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: []
    };
    const daySlotCounters = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0
    };
    data.forEach((item) => {
      const dayAbbrev = dayMapping[item.day_of_week.toLowerCase()];
      if (dayAbbrev) {
        const startTime = formatTime2(item.start_time);
        const endTime = formatTime2(item.end_time);
        let className, teacher;
        if (item.schedule_type === "subject") {
          className = item.subject_name || "Unknown Subject";
          teacher = item.teacher_name || "No Teacher Assigned";
        } else if (item.schedule_type === "activity") {
          className = item.activity_type_name || "Activity";
          teacher = item.teacher_name || "";
        }
        const classItem = {
          name: className,
          time: `${startTime} - ${endTime}`,
          room: item.room_name || "TBA",
          teacher,
          scheduleType: item.schedule_type,
          color: getSlotColor(daySlotCounters[dayAbbrev])
        };
        processedSchedule[dayAbbrev].push(classItem);
        daySlotCounters[dayAbbrev]++;
      }
    });
    return processedSchedule;
  }
  async function loadSchedule(studentId, silent = false) {
    try {
      update((state) => ({
        ...state,
        isLoading: !silent,
        isRefreshing: silent,
        error: null,
        currentStudentId: studentId
      }));
      const currentQuarterResponse = await fetch("/api/current-quarter");
      const currentQuarterData = await currentQuarterResponse.json();
      const schoolYear = currentQuarterData.data?.currentSchoolYear || "2025-2026";
      const response = await fetch(`/api/schedules?action=student-schedules&studentId=${studentId}&schoolYear=${schoolYear}`);
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch schedule data");
      }
      const processedData = processScheduleData2(result.data);
      update((state) => ({
        ...state,
        scheduleData: processedData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      }));
      cacheData2(studentId, {
        scheduleData: processedData,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Error loading student schedule:", error);
      update((state) => ({
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: error.message,
        scheduleData: {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: []
        }
      }));
    }
  }
  function init(studentId) {
    const cachedData = getCachedData2(studentId);
    if (cachedData) {
      update((state) => ({
        ...state,
        ...cachedData,
        currentStudentId: studentId,
        isLoading: false,
        isRefreshing: false,
        error: null
      }));
      return true;
    }
    update((state) => ({
      ...state,
      currentStudentId: studentId,
      isLoading: true,
      isRefreshing: false,
      error: null
    }));
    return false;
  }
  function forceRefresh(studentId) {
    try {
      const cacheKey = getCacheKey(studentId);
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.warn("Failed to clear student schedule cache:", error);
    }
    update((state) => ({
      ...initialState,
      currentStudentId: studentId,
      isLoading: true
    }));
    return store.loadSchedule(studentId, false);
  }
  const store = {
    subscribe,
    init,
    loadSchedule,
    forceRefresh,
    getCachedData: (studentId) => getCachedData2(studentId)
  };
  return store;
}
createStudentScheduleStore();
const CACHE_KEY$2 = "teacherProfileCache";
const CACHE_VALIDITY_MS$3 = 5 * 60 * 1e3;
function createTeacherProfileStore() {
  const { subscribe, set, update } = writable({
    teacherData: null,
    teacherProfileData: null,
    teacherSections: [],
    isLoading: false,
    isRefreshing: false,
    // For silent background refresh
    error: null,
    lastUpdated: null,
    isInitialized: false
  });
  const store = {
    subscribe,
    // Initialize store with cached data (immediate display)
    init: (teacherId) => {
      const cachedData = getCachedData$1(teacherId);
      if (cachedData) {
        update((state) => ({
          ...state,
          teacherData: cachedData.teacherData,
          teacherProfileData: cachedData.teacherProfileData,
          teacherSections: cachedData.teacherSections,
          lastUpdated: cachedData.lastUpdated,
          isInitialized: true,
          isLoading: false,
          error: null
        }));
        return true;
      }
      return false;
    },
    // Set loading state (only for initial load if no cache)
    setLoading: (loading, silent = false) => {
      update((state) => ({
        ...state,
        isLoading: loading && !state.isInitialized && !silent,
        isRefreshing: loading && silent,
        error: loading ? null : state.error
      }));
    },
    // Set error state
    setError: (errorMessage) => {
      update((state) => ({
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: errorMessage
      }));
    },
    // Update profile data and cache it
    updateProfileData: (teacherData, teacherProfileData, teacherSections, teacherId) => {
      const timestamp = Date.now();
      update((state) => ({
        ...state,
        teacherData,
        teacherProfileData,
        teacherSections,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: timestamp,
        isInitialized: true
      }));
      cacheData$1(teacherData, teacherProfileData, teacherSections, teacherId, timestamp);
    },
    // Load profile data with caching support
    loadProfile: async (teacherId, silent = false) => {
      try {
        update((state) => ({
          ...state,
          isLoading: !silent && !state.isInitialized,
          isRefreshing: silent,
          error: null
        }));
        const response = await api.get(`/api/accounts?type=teacher&limit=1000`);
        if (!response.success) {
          throw new Error(response.message || "Failed to fetch teacher data");
        }
        const currentUserData = response.accounts.find(
          (account) => account.id === teacherId || account.number === teacherId
        );
        if (!currentUserData) {
          throw new Error("Teacher data not found");
        }
        let teacherProfileData = null;
        try {
          const profileResponse = await api.get(`/api/teacher-profile?teacherId=${teacherId}`);
          if (profileResponse.success) {
            teacherProfileData = profileResponse.data;
          }
        } catch (err) {
          console.warn("Failed to fetch teacher profile data:", err);
        }
        let teacherSections = [];
        try {
          const currentQuarterResponse = await fetch("/api/current-quarter");
          const currentQuarterData = await currentQuarterResponse.json();
          const schoolYear = currentQuarterData.data?.currentSchoolYear || "2025-2026";
          const sectionsResponse = await fetch(`/api/teacher-sections?teacherId=${teacherId}&schoolYear=${schoolYear}`);
          if (sectionsResponse.ok) {
            const result = await sectionsResponse.json();
            if (result.success) {
              teacherSections = result.data.classData || [];
            }
          }
        } catch (err) {
          console.warn("Failed to fetch teacher sections:", err);
        }
        store.updateProfileData(currentUserData, teacherProfileData, teacherSections, teacherId);
      } catch (error) {
        console.error("Error loading teacher profile:", error);
        update((state) => ({
          ...state,
          isLoading: false,
          isRefreshing: false,
          error: error.message
        }));
      }
    },
    // Clear cache
    clearCache: (teacherId) => {
      try {
        const cacheKey = `${CACHE_KEY$2}_${teacherId}`;
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn("Failed to clear teacher profile cache:", error);
      }
    },
    // Force refresh (clear cache and reload)
    forceRefresh: async (teacherId) => {
      store.clearCache(teacherId);
      update((state) => ({
        ...state,
        isInitialized: false,
        teacherData: null,
        teacherProfileData: null,
        teacherSections: []
      }));
      await store.loadProfile(teacherId, false);
    }
  };
  return store;
}
function getCachedData$1(teacherId) {
  try {
    const cacheKey = `${CACHE_KEY$2}_${teacherId}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const data = JSON.parse(cached);
    const now = Date.now();
    if (now - data.timestamp > CACHE_VALIDITY_MS$3) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return {
      teacherData: data.teacherData,
      teacherProfileData: data.teacherProfileData,
      teacherSections: data.teacherSections,
      lastUpdated: data.timestamp
    };
  } catch (error) {
    console.warn("Failed to get cached teacher profile data:", error);
    return null;
  }
}
function cacheData$1(teacherData, teacherProfileData, teacherSections, teacherId, timestamp) {
  try {
    const cacheKey = `${CACHE_KEY$2}_${teacherId}`;
    const dataToCache = {
      teacherData,
      teacherProfileData,
      teacherSections,
      timestamp
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
  } catch (error) {
    console.warn("Failed to cache teacher profile data:", error);
  }
}
createTeacherProfileStore();
const CACHE_KEY$1 = "teacherScheduleCache";
const CACHE_VALIDITY_MS$2 = 5 * 60 * 1e3;
function createTeacherScheduleStore() {
  const { subscribe, set, update } = writable({
    scheduleData: {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: []
    },
    isLoading: false,
    isRefreshing: false,
    // For silent background refresh
    error: null,
    lastUpdated: null,
    isInitialized: false
  });
  const store = {
    subscribe,
    // Initialize store with cached data (immediate display)
    init: (teacherId, schoolYear) => {
      const cachedData = getCachedData(teacherId, schoolYear);
      if (cachedData) {
        update((state) => ({
          ...state,
          scheduleData: cachedData.scheduleData,
          lastUpdated: cachedData.lastUpdated,
          isInitialized: true,
          isLoading: false,
          error: null
        }));
        return true;
      }
      return false;
    },
    // Set loading state (only for initial load if no cache)
    setLoading: (loading, silent = false) => {
      update((state) => ({
        ...state,
        isLoading: loading && !state.isInitialized && !silent,
        isRefreshing: loading && silent,
        error: loading ? null : state.error
      }));
    },
    // Update schedule data and cache it
    updateScheduleData: (newScheduleData, teacherId, schoolYear, silent = false) => {
      const now = Date.now();
      update((state) => ({
        ...state,
        scheduleData: newScheduleData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: now,
        isInitialized: true
      }));
      cacheData(newScheduleData, teacherId, schoolYear, now);
    },
    // Set error state
    setError: (error, silent = false) => {
      update((state) => ({
        ...state,
        error,
        isLoading: false,
        isRefreshing: false
      }));
    },
    // Load schedule data with caching support
    loadSchedule: async (teacherId, schoolYear, silent = false) => {
      try {
        update((state) => ({
          ...state,
          isLoading: !silent && !state.isInitialized,
          isRefreshing: silent,
          error: null
        }));
        let currentSchoolYear = schoolYear;
        if (!currentSchoolYear) {
          const currentQuarterResponse = await fetch("/api/current-quarter");
          const currentQuarterData = await currentQuarterResponse.json();
          currentSchoolYear = currentQuarterData.data?.currentSchoolYear || "2025-2026";
        }
        const response = await fetch(`/api/schedules?action=teacher-schedules&teacherId=${teacherId}&schoolYear=${currentSchoolYear}`);
        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to fetch schedule data");
        }
        const processedData = processScheduleData(result.data);
        update((state) => ({
          ...state,
          scheduleData: processedData,
          isLoading: false,
          isRefreshing: false,
          error: null,
          lastUpdated: Date.now(),
          isInitialized: true
        }));
        cacheData(processedData, teacherId, currentSchoolYear, Date.now());
      } catch (error) {
        console.error("Error loading teacher schedule:", error);
        update((state) => ({
          ...state,
          error: error.message,
          isLoading: false,
          isRefreshing: false
        }));
      }
    },
    // Clear cache
    clearCache: (teacherId, schoolYear) => {
      try {
        const cacheKey = `${CACHE_KEY$1}_${teacherId}_${schoolYear}`;
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn("Failed to clear teacher schedule cache:", error);
      }
    },
    // Force refresh (clear cache and reload)
    forceRefresh: async (teacherId, schoolYear) => {
      try {
        const cacheKey = `${CACHE_KEY$1}_${teacherId}_${schoolYear}`;
        localStorage.removeItem(cacheKey);
      } catch (error) {
        console.warn("Failed to clear cache during force refresh:", error);
      }
      update((state) => ({
        ...state,
        isInitialized: false,
        scheduleData: {
          Mon: [],
          Tue: [],
          Wed: [],
          Thu: [],
          Fri: []
        }
      }));
      await store.loadSchedule(teacherId, schoolYear, false);
    }
  };
  return store;
}
function getCachedData(teacherId, schoolYear) {
  try {
    const cacheKey = `${CACHE_KEY$1}_${teacherId}_${schoolYear}`;
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    const data = JSON.parse(cached);
    const now = Date.now();
    if (now - data.timestamp > CACHE_VALIDITY_MS$2) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return {
      scheduleData: data.scheduleData,
      lastUpdated: data.timestamp
    };
  } catch (error) {
    console.warn("Failed to retrieve cached teacher schedule:", error);
    return null;
  }
}
function cacheData(scheduleData, teacherId, schoolYear, timestamp) {
  try {
    const cacheKey = `${CACHE_KEY$1}_${teacherId}_${schoolYear}`;
    const cacheData2 = {
      scheduleData,
      timestamp,
      teacherId,
      schoolYear
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData2));
  } catch (error) {
    console.warn("Failed to cache teacher schedule data:", error);
  }
}
function processScheduleData(data) {
  const processedSchedule = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: []
  };
  const dayMapping = {
    "monday": "Mon",
    "tuesday": "Tue",
    "wednesday": "Wed",
    "thursday": "Thu",
    "friday": "Fri"
  };
  const slotColors = ["blue", "green", "purple", "yellow", "orange"];
  function getSlotColor(slotIndex) {
    return slotColors[slotIndex % slotColors.length];
  }
  const daySlotCounters = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0
  };
  data.forEach((item) => {
    const dayAbbrev = dayMapping[item.day_of_week.toLowerCase()];
    if (dayAbbrev) {
      const startTime = formatTime(item.start_time);
      const endTime = formatTime(item.end_time);
      let className, subject;
      if (item.schedule_type === "subject") {
        className = item.section_name;
        subject = item.subject_name || "Unknown Subject";
      } else if (item.schedule_type === "activity") {
        className = item.activity_type_name || "Activity";
        subject = item.activity_type_name || "Activity";
      }
      const classItem = {
        name: className,
        time: `${startTime} - ${endTime}`,
        room: item.room_name || "TBA",
        subject,
        gradeLevel: item.grade_level,
        scheduleType: item.schedule_type,
        color: getSlotColor(daySlotCounters[dayAbbrev])
      };
      processedSchedule[dayAbbrev].push(classItem);
      daySlotCounters[dayAbbrev]++;
    }
  });
  Object.keys(processedSchedule).forEach((day) => {
    const classes = processedSchedule[day];
    const vacantTimes = detectVacantTimes(classes);
    const combinedSchedule = [...classes, ...vacantTimes].sort((a, b) => {
      const aStartTime = timeToMinutes(a.time.split(" - ")[0]);
      const bStartTime = timeToMinutes(b.time.split(" - ")[0]);
      return aStartTime - bStartTime;
    });
    processedSchedule[day] = combinedSchedule;
  });
  return processedSchedule;
}
function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}
function timeToMinutes(timeString) {
  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  let totalMinutes = minutes;
  if (period === "PM" && hours !== 12) {
    totalMinutes += (hours + 12) * 60;
  } else if (period === "AM" && hours === 12) {
    totalMinutes += 0;
  } else {
    totalMinutes += hours * 60;
  }
  return totalMinutes;
}
function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}
function detectVacantTimes(classes) {
  if (classes.length <= 1) return [];
  const sortedClasses = [...classes].sort((a, b) => {
    const aStartTime = timeToMinutes(a.time.split(" - ")[0]);
    const bStartTime = timeToMinutes(b.time.split(" - ")[0]);
    return aStartTime - bStartTime;
  });
  const vacantTimes = [];
  for (let i = 0; i < sortedClasses.length - 1; i++) {
    const currentClass = sortedClasses[i];
    const nextClass = sortedClasses[i + 1];
    const currentEndTime = timeToMinutes(currentClass.time.split(" - ")[1]);
    const nextStartTime = timeToMinutes(nextClass.time.split(" - ")[0]);
    if (nextStartTime > currentEndTime) {
      const vacantStartTime = minutesToTime(currentEndTime);
      const vacantEndTime = minutesToTime(nextStartTime);
      vacantTimes.push({
        name: "Vacant Time",
        time: `${vacantStartTime} - ${vacantEndTime}`,
        room: "Available",
        subject: "Free Period",
        color: "gray",
        isVacant: true
      });
    }
  }
  return vacantTimes;
}
createTeacherScheduleStore();
function createDashboardStore() {
  const { subscribe, set, update } = writable({
    data: [
      { id: "students", label: "Total Students", value: 0, icon: "school", color: "blue" },
      { id: "teachers", label: "Total Teachers", value: 0, icon: "person", color: "green" },
      { id: "sections", label: "Total Sections", value: 0, icon: "class", color: "orange" },
      { id: "rooms", label: "Total Rooms", value: 0, icon: "meeting_room", color: "purple" }
    ],
    isLoading: false,
    error: null,
    lastUpdated: null,
    isInitialized: false
  });
  return {
    subscribe,
    // Initialize with cached data (show immediately)
    init: (cachedData) => {
      if (cachedData) {
        update((state) => ({
          ...state,
          data: cachedData,
          isInitialized: true,
          isLoading: false
        }));
      }
    },
    // Set loading state (only for initial load if no cache)
    setLoading: (loading) => {
      update((state) => ({
        ...state,
        isLoading: loading && !state.isInitialized
      }));
    },
    // Update data silently (background refresh)
    updateData: (newData) => {
      update((state) => ({
        ...state,
        data: newData,
        isLoading: false,
        error: null,
        lastUpdated: /* @__PURE__ */ new Date(),
        isInitialized: true
      }));
      try {
        localStorage.setItem("dashboard-stats-cache", JSON.stringify({
          data: newData,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("Failed to cache dashboard data:", e);
      }
    },
    // Set error state
    setError: (error) => {
      update((state) => ({
        ...state,
        error,
        isLoading: false
      }));
    },
    // Get cached data from localStorage
    getCachedData: () => {
      try {
        const cached = localStorage.getItem("dashboard-stats-cache");
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1e3) {
            return data;
          }
        }
      } catch (e) {
        console.warn("Failed to retrieve cached dashboard data:", e);
      }
      return null;
    },
    // Clear cache
    clearCache: () => {
      try {
        localStorage.removeItem("dashboard-stats-cache");
      } catch (e) {
        console.warn("Failed to clear dashboard cache:", e);
      }
    }
  };
}
createDashboardStore();
const CACHE_KEY = "roomManagementData";
const SECTIONS_CACHE_KEY$1 = "availableSectionsData";
const CACHE_VALIDITY_MS$1 = 5 * 60 * 1e3;
function createRoomManagementStore() {
  const { subscribe, set, update } = writable({
    rooms: [],
    availableSections: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });
  return {
    subscribe,
    // Initialize store with cached data
    init: (cachedData) => {
      if (cachedData && cachedData.rooms) {
        set({
          rooms: cachedData.rooms,
          availableSections: cachedData.availableSections || [],
          isLoading: false,
          error: null,
          lastUpdated: cachedData.lastUpdated
        });
      }
    },
    // Set loading state
    setLoading: (loading) => {
      update((state) => ({
        ...state,
        isLoading: loading,
        error: loading ? null : state.error
      }));
    },
    // Update rooms data and cache it
    updateRooms: (rooms) => {
      const now = Date.now();
      const newState = {
        rooms,
        lastUpdated: now,
        isLoading: false,
        error: null
      };
      update((state) => ({
        ...state,
        ...newState
      }));
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          rooms,
          lastUpdated: now
        }));
      } catch (error) {
        console.warn("Failed to cache rooms data:", error);
      }
    },
    // Update available sections data and cache it
    updateSections: (sections) => {
      const now = Date.now();
      update((state) => ({
        ...state,
        availableSections: sections,
        lastUpdated: now
      }));
      try {
        localStorage.setItem(SECTIONS_CACHE_KEY$1, JSON.stringify({
          sections,
          lastUpdated: now
        }));
      } catch (error) {
        console.warn("Failed to cache sections data:", error);
      }
    },
    // Set error state
    setError: (error) => {
      update((state) => ({
        ...state,
        error,
        isLoading: false
      }));
    },
    // Get cached data if valid
    getCachedData: () => {
      try {
        const roomsCache = localStorage.getItem(CACHE_KEY);
        const sectionsCache = localStorage.getItem(SECTIONS_CACHE_KEY$1);
        if (!roomsCache) return null;
        const roomsData = JSON.parse(roomsCache);
        const sectionsData = sectionsCache ? JSON.parse(sectionsCache) : { sections: [] };
        const now = Date.now();
        const roomsAge = now - (roomsData.lastUpdated || 0);
        const sectionsAge = now - (sectionsData.lastUpdated || 0);
        if (roomsAge < CACHE_VALIDITY_MS$1) {
          return {
            rooms: roomsData.rooms || [],
            availableSections: sectionsAge < CACHE_VALIDITY_MS$1 ? sectionsData.sections || [] : [],
            lastUpdated: roomsData.lastUpdated
          };
        }
        return null;
      } catch (error) {
        console.warn("Failed to retrieve cached room data:", error);
        return null;
      }
    },
    // Clear cache
    clearCache: () => {
      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(SECTIONS_CACHE_KEY$1);
      } catch (error) {
        console.warn("Failed to clear room cache:", error);
      }
    },
    // Add a new room to the store
    addRoom: (room) => {
      update((state) => {
        const newRooms = [room, ...state.rooms];
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            rooms: newRooms,
            lastUpdated: Date.now()
          }));
        } catch (error) {
          console.warn("Failed to update cache after adding room:", error);
        }
        return {
          ...state,
          rooms: newRooms
        };
      });
    },
    // Remove a room from the store
    removeRoom: (roomId) => {
      update((state) => {
        const newRooms = state.rooms.filter((room) => room.id !== roomId);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            rooms: newRooms,
            lastUpdated: Date.now()
          }));
        } catch (error) {
          console.warn("Failed to update cache after removing room:", error);
        }
        return {
          ...state,
          rooms: newRooms
        };
      });
    },
    // Update a specific room in the store
    updateRoom: (roomId, updatedRoom) => {
      update((state) => {
        const newRooms = state.rooms.map(
          (room) => room.id === roomId ? { ...room, ...updatedRoom } : room
        );
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            rooms: newRooms,
            lastUpdated: Date.now()
          }));
        } catch (error) {
          console.warn("Failed to update cache after updating room:", error);
        }
        return {
          ...state,
          rooms: newRooms
        };
      });
    }
  };
}
createRoomManagementStore();
const SECTIONS_CACHE_KEY = "sectionsCache";
const CACHE_VALIDITY_MS = 3 * 60 * 1e3;
(() => {
  const sections = writable([]);
  const isLoadingSections = writable(false);
  const sectionsError = writable(null);
  const getCachedSections = () => {
    try {
      const cached = localStorage.getItem(SECTIONS_CACHE_KEY);
      if (!cached) return null;
      const data = JSON.parse(cached);
      const now = Date.now();
      if (now - data.timestamp > CACHE_VALIDITY_MS) {
        localStorage.removeItem(SECTIONS_CACHE_KEY);
        return null;
      }
      return data.sections;
    } catch (error) {
      console.error("Error reading sections cache:", error);
      localStorage.removeItem(SECTIONS_CACHE_KEY);
      return null;
    }
  };
  const setCachedSections = (sectionsData) => {
    try {
      const cacheData2 = {
        sections: sectionsData,
        timestamp: Date.now()
      };
      localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData2));
    } catch (error) {
      console.error("Error setting sections cache:", error);
    }
  };
  const clearSectionsCache = () => {
    try {
      localStorage.removeItem(SECTIONS_CACHE_KEY);
    } catch (error) {
      console.error("Error clearing sections cache:", error);
    }
  };
  const initSections = () => {
    const cachedSections = getCachedSections();
    if (cachedSections) {
      sections.set(cachedSections);
      return true;
    }
    return false;
  };
  const updateSections = (newSections, silent = false) => {
    sections.set(newSections);
    sectionsError.set(null);
    if (!silent) {
      isLoadingSections.set(false);
    }
    setCachedSections(newSections);
  };
  const setLoadingSections = (loading, silent = false) => {
    if (!silent) {
      isLoadingSections.set(loading);
    }
  };
  const setSectionsError = (error) => {
    sectionsError.set(error);
    isLoadingSections.set(false);
  };
  const loadSections = async (silent = false, searchTerm = "") => {
    try {
      setLoadingSections(true, silent);
      let url = "/api/sections";
      if (searchTerm && searchTerm.trim()) {
        url += `?search=${encodeURIComponent(searchTerm.trim())}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error("Invalid API response structure");
      }
      const processedSections = result.data.map((section) => ({
        ...section,
        students: section.students || [],
        adviser: section.adviser || null
      }));
      updateSections(processedSections, silent);
    } catch (error) {
      console.error("Error loading sections:", error);
      setSectionsError(error.message);
    } finally {
      setLoadingSections(false, false);
    }
  };
  const addSection = (newSection) => {
    sections.update((currentSections) => {
      const updated = [...currentSections, newSection];
      setCachedSections(updated);
      return updated;
    });
  };
  const updateSection = (sectionId, updatedSection) => {
    sections.update((currentSections) => {
      const updated = currentSections.map(
        (section) => section.id === sectionId ? { ...section, ...updatedSection } : section
      );
      setCachedSections(updated);
      return updated;
    });
  };
  const removeSection = (sectionId) => {
    sections.update((currentSections) => {
      const updated = currentSections.filter((section) => section.id !== sectionId);
      setCachedSections(updated);
      return updated;
    });
  };
  return {
    // Stores
    sections: { subscribe: sections.subscribe },
    isLoadingSections: { subscribe: isLoadingSections.subscribe },
    sectionsError: { subscribe: sectionsError.subscribe },
    // Methods
    initSections,
    loadSections,
    updateSections,
    setLoadingSections,
    setSectionsError,
    addSection,
    updateSection,
    removeSection,
    clearSectionsCache
  };
})();
function _page($$payload, $$props) {
  push();
  let pageTitle = "Login - High School Student Information System";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>${escape_html(pageTitle)}</title>`;
    $$payload2.out.push(`<meta name="description" content="High School Student Information System"/>`);
  });
  $$payload.out.push(`<div class="app-container">`);
  {
    $$payload.out.push("<!--[-->");
    Loginpage($$payload);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DLRqL0L6.js.map

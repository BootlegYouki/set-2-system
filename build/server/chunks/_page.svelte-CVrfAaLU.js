import { w as push, G as head, y as pop, K as escape_html, J as attr_class, N as attr, M as stringify, F as writable } from './index-B9K8BHQO.js';
import './auth-yOKzbV7p.js';

function Loginpage($$payload, $$props) {
  push();
  let idNumber = "";
  let password = "";
  let isLoading = false;
  $$payload.out.push(`<div class="login-container"><button class="theme-toggle-btn" aria-label="Toggle dark mode"><span class="material-symbols-outlined">${escape_html("dark_mode")}</span></button> <div class="left-side"><div class="login-header"><h1 class="login-title">Login</h1> <h2 class="login-subtitle">Enter your account details</h2></div> <form class="login-form" novalidate autocomplete="off"><div class="form-field"><div${attr_class(`custom-text-field ${stringify("")}`)}><span class="leading-icon material-symbols-outlined">badge</span> <input type="text"${attr("value", idNumber)} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" class="text-input" placeholder=" "/> <label class="text-label" for="idnumber-input">ID Number</label></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="form-field"><div${attr_class(`custom-text-field ${stringify("")}`)}><span class="leading-icon material-symbols-outlined">lock</span> <input${attr("type", "password")}${attr("value", password)} autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" class="text-input" placeholder=" "/> <label class="text-label" for="password-input">Password</label> <button type="button" class="trailing-icon-button"${attr("aria-label", "Show password")}><span class="material-symbols-outlined">${escape_html("visibility_off")}</span></button></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <button id="login-submit-btn" type="submit" class="custom-filled-button login-submit"${attr("disabled", isLoading, true)} aria-label="Sign in">`);
  {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<span>Login</span>`);
  }
  $$payload.out.push(`<!--]--></button> <button type="button" id="forgot-password-btn" class="custom-text-button forgot-password" aria-label="forgot-password">Forgot Password?</button></form></div> <div class="right-side"><div class="welcome-text"><h1 class="welcome-title">Welcome</h1> <p class="welcome-subtitle">Login to access your account</p></div></div></div>`);
  pop();
}
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
      const cacheData = {
        sections: sectionsData,
        timestamp: Date.now()
      };
      localStorage.setItem(SECTIONS_CACHE_KEY, JSON.stringify(cacheData));
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
  const loadSections = async (silent = false) => {
    try {
      setLoadingSections(true, silent);
      const response = await fetch("/api/sections");
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
//# sourceMappingURL=_page.svelte-CVrfAaLU.js.map

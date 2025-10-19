import { writable } from 'svelte/store';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY_PREFIX = 'student_profile_';

// Create the store
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

	// Helper function to get cache key
	function getCacheKey(studentId) {
		return `${CACHE_KEY_PREFIX}${studentId}`;
	}

	// Helper function to check if cached data is valid
	function isCacheValid(cachedData) {
		if (!cachedData || !cachedData.timestamp) return false;
		return Date.now() - cachedData.timestamp < CACHE_DURATION;
	}

	// Helper function to get cached data
	function getCachedData(studentId) {
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
			console.warn('Failed to retrieve cached student profile data:', error);
		}
		return null;
	}

	// Helper function to cache data
	function cacheData(studentId, data) {
		try {
			const cacheKey = getCacheKey(studentId);
			const cacheEntry = {
				data,
				timestamp: Date.now()
			};
			localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
		} catch (error) {
			console.warn('Failed to cache student profile data:', error);
		}
	}

	// Main function to load profile data
	async function loadProfile(studentId, silent = false) {
		try {
			// Set loading state (only if not silent)
			update(state => ({
				...state,
				isLoading: !silent,
				isRefreshing: silent,
				error: null,
				currentStudentId: studentId
			}));

			// Fetch student data from accounts API
			const response = await fetch(`/api/accounts?type=student&limit=1000`);
			
			if (!response.ok) {
				throw new Error('Failed to fetch student data');
			}

			const result = await response.json();
			
			if (!result.success) {
				throw new Error(result.message || 'Failed to fetch student data');
			}

			// Find the current student's data in the accounts list
			const currentStudentData = result.accounts.find(account => 
				account.id === studentId || 
				account.number === studentId
			);

			if (!currentStudentData) {
				throw new Error('Student data not found');
			}

			// Fetch additional student profile data if available
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
				// Don't throw error here as basic profile should still work
				console.warn('Failed to fetch additional student profile data:', err);
			}

			// Fetch student sections if available
			let studentSections = [];
			try {
				const currentQuarterResponse = await fetch('/api/current-quarter');
				const currentQuarterData = await currentQuarterResponse.json();
				const schoolYear = currentQuarterData.data?.currentSchoolYear || '2025-2026';

				const sectionsResponse = await fetch(`/api/student-sections?studentId=${studentId}&schoolYear=${schoolYear}`);
				if (sectionsResponse.ok) {
					const sectionsResult = await sectionsResponse.json();
					if (sectionsResult.success) {
						studentSections = sectionsResult.data.classData || [];
					}
				}
			} catch (err) {
				// Don't throw error here as basic profile should still work
				console.warn('Failed to fetch student sections:', err);
			}

			// Update store with new data
			const profileData = {
				studentData: currentStudentData,
				studentProfileData,
				studentSections,
				lastUpdated: new Date().toISOString()
			};

			update(state => ({
				...state,
				...profileData,
				isLoading: false,
				isRefreshing: false,
				error: null
			}));

			// Cache the data
			cacheData(studentId, profileData);

		} catch (error) {
			console.error('Error loading student profile:', error);
			
			update(state => ({
				...state,
				isLoading: false,
				isRefreshing: false,
				error: error.message
			}));
		}
	}

	// Initialize store with cached data if available
	function init(studentId) {
		const cachedData = getCachedData(studentId);
		if (cachedData) {
			update(state => ({
				...state,
				...cachedData,
				currentStudentId: studentId,
				isLoading: false,
				isRefreshing: false,
				error: null
			}));
			return true; // Has cached data
		}
		
		// No cached data, set up initial state
		update(state => ({
			...state,
			currentStudentId: studentId,
			isLoading: true,
			isRefreshing: false,
			error: null
		}));
		return false; // No cached data
	}

	// Force refresh (clear cache and reload)
	function forceRefresh(studentId) {
		// Clear cache
		try {
			const cacheKey = getCacheKey(studentId);
			localStorage.removeItem(cacheKey);
		} catch (error) {
			console.warn('Failed to clear student profile cache:', error);
		}

		// Reset store state
		update(state => ({
			...initialState,
			currentStudentId: studentId,
			isLoading: true
		}));

		// Load fresh data
		return store.loadProfile(studentId, false);
	}

	const store = {
		subscribe,
		init,
		loadProfile,
		forceRefresh,
		getCachedData: (studentId) => getCachedData(studentId)
	};

	return store;
}

export const studentProfileStore = createStudentProfileStore();
import { writable } from 'svelte/store';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const CACHE_KEY_PREFIX = 'student_grades_';

// Create the store
function createStudentGradeStore() {
	const initialState = {
		grades: [],
		statistics: {
			overallAverage: 0,
			totalSubjects: 0
		},
		sectionInfo: null,
		classRank: null,
		totalStudentsInSection: 0,
		currentQuarter: 2,
		currentQuarterName: '2nd Quarter',
		currentSchoolYear: '2025-2026',
		isLoading: false,
		isRefreshing: false,
		error: null,
		lastUpdated: null,
		currentStudentId: null
	};

	const { subscribe, set, update } = writable(initialState);

	// Helper function to get cache key
	function getCacheKey(studentId, quarter, schoolYear) {
		return `${CACHE_KEY_PREFIX}${studentId}_${quarter}_${schoolYear}`;
	}

	// Helper function to check if cached data is valid
	function isCacheValid(cachedData) {
		if (!cachedData || !cachedData.timestamp) return false;
		return Date.now() - cachedData.timestamp < CACHE_DURATION;
	}

	// Helper function to get cached data
	function getCachedData(studentId, quarter, schoolYear) {
		try {
			const cacheKey = getCacheKey(studentId, quarter, schoolYear);
			const cached = localStorage.getItem(cacheKey);
			if (cached) {
				const parsedData = JSON.parse(cached);
				if (isCacheValid(parsedData)) {
					return parsedData.data;
				}
			}
		} catch (error) {
			console.warn('Failed to retrieve cached student grades data:', error);
		}
		return null;
	}

	// Helper function to cache data
	function cacheData(studentId, quarter, schoolYear, data) {
		try {
			const cacheKey = getCacheKey(studentId, quarter, schoolYear);
			const cacheEntry = {
				data,
				timestamp: Date.now()
			};
			localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
		} catch (error) {
			console.warn('Failed to cache student grades data:', error);
		}
	}

	// Fetch current quarter and school year
	async function fetchCurrentQuarter() {
		try {
			const response = await fetch('/api/current-quarter');
			const data = await response.json();
			
			if (data.success && data.data) {
				return {
					currentQuarter: data.data.currentQuarter,
					currentQuarterName: data.data.quarterName,
					currentSchoolYear: data.data.currentSchoolYear
				};
			}
		} catch (err) {
			console.error('Error fetching current quarter/school year:', err);
		}
		
		// Return defaults if fetch fails
		return {
			currentQuarter: 2,
			currentQuarterName: '2nd Quarter',
			currentSchoolYear: '2025-2026'
		};
	}

	// Fetch student profile data for section and class rank
	async function fetchStudentProfile(studentId) {
		try {
			const response = await fetch(`/api/student-profile?studentId=${studentId}`);
			const result = await response.json();
			
			if (result.success) {
				const { section, academicSummary } = result.data;
				return {
					sectionInfo: section,
					classRank: academicSummary.classRank,
					totalStudentsInSection: academicSummary.totalStudentsInSection
				};
			}
		} catch (err) {
			console.error('Error fetching student profile:', err);
		}
		return {
			sectionInfo: null,
			classRank: null,
			totalStudentsInSection: 0
		};
	}

	// Main function to load grades data
	async function loadGrades(studentId, quarter = null, schoolYear = null, silent = false) {
		try {
			// Set loading state (only if not silent)
			update(state => ({
				...state,
				isLoading: !silent,
				isRefreshing: silent,
				error: null,
				currentStudentId: studentId
			}));

			// Fetch current quarter/school year if not provided
			let quarterData;
			if (!quarter || !schoolYear) {
				quarterData = await fetchCurrentQuarter();
				quarter = quarter || quarterData.currentQuarter;
				schoolYear = schoolYear || quarterData.currentSchoolYear;
			} else {
				quarterData = {
					currentQuarter: quarter,
					currentQuarterName: `${quarter}${quarter === 1 ? 'st' : quarter === 2 ? 'nd' : quarter === 3 ? 'rd' : 'th'} Quarter`,
					currentSchoolYear: schoolYear
				};
			}

			// Fetch grades data
			const gradesResponse = await fetch(`/api/student-grades?student_id=${studentId}&quarter=${quarter}&school_year=${schoolYear}`);
			const gradesResult = await gradesResponse.json();

			if (!gradesResult.success) {
				throw new Error(gradesResult.error || 'Failed to fetch grades data');
			}

			// Fetch student profile data
			const profileData = await fetchStudentProfile(studentId);

			// Update store with new data
			const newState = {
				grades: gradesResult.data.grades || [],
				statistics: gradesResult.data.statistics || { overallAverage: 0, totalSubjects: 0 },
				sectionInfo: profileData.sectionInfo,
				classRank: profileData.classRank,
				totalStudentsInSection: profileData.totalStudentsInSection,
				currentQuarter: quarter,
				currentQuarterName: quarterData.currentQuarterName,
				currentSchoolYear: schoolYear,
				isLoading: false,
				isRefreshing: false,
				error: null,
				lastUpdated: new Date().toISOString(),
				currentStudentId: studentId
			};

			update(state => ({
				...state,
				...newState
			}));

			// Cache the data
			cacheData(studentId, quarter, schoolYear, {
				grades: newState.grades,
				statistics: newState.statistics,
				sectionInfo: newState.sectionInfo,
				classRank: newState.classRank,
				totalStudentsInSection: newState.totalStudentsInSection,
				currentQuarter: quarter,
				currentQuarterName: quarterData.currentQuarterName,
				currentSchoolYear: schoolYear,
				lastUpdated: newState.lastUpdated
			});

		} catch (error) {
			console.error('Error loading student grades:', error);
			
			update(state => ({
				...state,
				isLoading: false,
				isRefreshing: false,
				error: error.message,
				grades: [],
				statistics: {
					overallAverage: 0,
					totalSubjects: 0
				}
			}));
		}
	}

	// Initialize store with cached data if available
	function init(studentId, quarter = null, schoolYear = null) {
		// If quarter/schoolYear not provided, we need to fetch them first
		if (!quarter || !schoolYear) {
			fetchCurrentQuarter().then(quarterData => {
				const cachedData = getCachedData(
					studentId, 
					quarterData.currentQuarter, 
					quarterData.currentSchoolYear
				);
				
				if (cachedData) {
					update(state => ({
						...state,
						...cachedData,
						currentStudentId: studentId,
						isLoading: false,
						isRefreshing: false,
						error: null
					}));
				} else {
					update(state => ({
						...state,
						currentStudentId: studentId,
						currentQuarter: quarterData.currentQuarter,
						currentQuarterName: quarterData.currentQuarterName,
						currentSchoolYear: quarterData.currentSchoolYear,
						isLoading: true,
						isRefreshing: false,
						error: null
					}));
				}
			});
			return false;
		}

		const cachedData = getCachedData(studentId, quarter, schoolYear);
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
			currentQuarter: quarter,
			currentSchoolYear: schoolYear,
			isLoading: true,
			isRefreshing: false,
			error: null
		}));
		return false; // No cached data
	}

	// Change quarter
	async function changeQuarter(studentId, quarter, schoolYear) {
		// Check cache first
		const cachedData = getCachedData(studentId, quarter, schoolYear);
		if (cachedData) {
			update(state => ({
				...state,
				...cachedData,
				currentStudentId: studentId,
				isLoading: false,
				isRefreshing: false,
				error: null
			}));
		}
		
		// Load fresh data (silent if we have cache)
		await loadGrades(studentId, quarter, schoolYear, !!cachedData);
	}

	// Force refresh (clear cache and reload)
	function forceRefresh(studentId, quarter, schoolYear) {
		// Clear cache
		try {
			const cacheKey = getCacheKey(studentId, quarter, schoolYear);
			localStorage.removeItem(cacheKey);
		} catch (error) {
			console.warn('Failed to clear student grades cache:', error);
		}

		// Reset store state
		update(state => ({
			...initialState,
			currentStudentId: studentId,
			currentQuarter: quarter,
			currentSchoolYear: schoolYear,
			isLoading: true
		}));

		// Load fresh data
		return store.loadGrades(studentId, quarter, schoolYear, false);
	}

	const store = {
		subscribe,
		init,
		loadGrades,
		changeQuarter,
		forceRefresh,
		getCachedData: (studentId, quarter, schoolYear) => getCachedData(studentId, quarter, schoolYear)
	};

	return store;
}

export const studentGradeStore = createStudentGradeStore();


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
		currentStudentId: null,
		previousQuarterAverage: null,
		averageChange: null
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

	// Fetch student profile data for section info
	async function fetchStudentProfile(studentId) {
		try {
			const response = await fetch(`/api/student-profile?studentId=${studentId}`);
			const result = await response.json();
			
			if (result.success) {
				const { section } = result.data;
				return {
					sectionInfo: section
				};
			}
		} catch (err) {
			console.error('Error fetching student profile:', err);
		}
		return {
			sectionInfo: null
		};
	}

	// Fetch class rank for specific quarter and school year
	async function fetchClassRank(studentId, quarter, schoolYear) {
		try {
			const response = await fetch(`/api/class-rankings?studentId=${studentId}&quarter=${quarter}&schoolYear=${schoolYear}`);
			const result = await response.json();
			
			if (result.success) {
				return {
					classRank: result.myRank,
					totalStudentsInSection: result.totalStudents
				};
			}
		} catch (err) {
			console.error('Error fetching class rank:', err);
		}
		return {
			classRank: null,
			totalStudentsInSection: 0
		};
	}

	// Fetch previous quarter's average for comparison
	async function fetchPreviousQuarterAverage(studentId, currentQuarter, schoolYear) {
		try {
			// Determine previous quarter
			let prevQuarter = currentQuarter - 1;
			let prevSchoolYear = schoolYear;
			
			// If current quarter is 1, get quarter 4 from previous school year
			if (prevQuarter < 1) {
				prevQuarter = 4;
				// Parse school year and decrement
				const [startYear, endYear] = schoolYear.split('-').map(y => parseInt(y));
				prevSchoolYear = `${startYear - 1}-${endYear - 1}`;
			}
			
			// Fetch previous quarter grades
			const response = await fetch(`/api/student-grades?student_id=${studentId}&quarter=${prevQuarter}&school_year=${prevSchoolYear}`);
			const result = await response.json();
			
			if (result.success && result.data.statistics) {
				return result.data.statistics.overallAverage || null;
			}
		} catch (err) {
			console.error('Error fetching previous quarter average:', err);
		}
		return null;
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

		// Fetch grades data, profile, class rank, and previous quarter average in parallel
		const [gradesResult, profileData, rankData, previousAverage] = await Promise.all([
			fetch(`/api/student-grades?student_id=${studentId}&quarter=${quarter}&school_year=${schoolYear}`)
				.then(res => res.json()),
			fetchStudentProfile(studentId),
			fetchClassRank(studentId, quarter, schoolYear),
			fetchPreviousQuarterAverage(studentId, quarter, schoolYear)
		]);

		if (!gradesResult.success) {
			throw new Error(gradesResult.error || 'Failed to fetch grades data');
		}

		// Calculate average change
		const currentAverage = gradesResult.data.statistics?.overallAverage || 0;
		let averageChange = null;
		if (previousAverage !== null && currentAverage > 0) {
			averageChange = currentAverage - previousAverage;
		}

		// Update store with new data
		const newState = {
			grades: gradesResult.data.grades || [],
			statistics: gradesResult.data.statistics || { overallAverage: 0, totalSubjects: 0 },
			sectionInfo: profileData.sectionInfo,
			classRank: rankData.classRank,
			totalStudentsInSection: rankData.totalStudentsInSection,
			currentQuarter: quarter,
			currentQuarterName: quarterData.currentQuarterName,
			currentSchoolYear: schoolYear,
			previousQuarterAverage: previousAverage,
			averageChange: averageChange,
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

		// Cache the data (including quarter-specific rank)
		cacheData(studentId, quarter, schoolYear, {
			grades: newState.grades,
			statistics: newState.statistics,
			sectionInfo: newState.sectionInfo,
			classRank: newState.classRank,
			totalStudentsInSection: newState.totalStudentsInSection,
			currentQuarter: quarter,
			currentQuarterName: quarterData.currentQuarterName,
			currentSchoolYear: schoolYear,
			previousQuarterAverage: newState.previousQuarterAverage,
			averageChange: newState.averageChange,
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
				},
				previousQuarterAverage: null,
				averageChange: null
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

	// Clear all cached data for a student (useful for debugging/testing)
	function clearAllCache(studentId) {
		try {
			const keys = Object.keys(localStorage);
			const prefix = `${CACHE_KEY_PREFIX}${studentId}_`;
			keys.forEach(key => {
				if (key.startsWith(prefix)) {
					localStorage.removeItem(key);
				}
			});
		} catch (error) {
			console.warn('Failed to clear all cache:', error);
		}
	}

	const store = {
		subscribe,
		init,
		loadGrades,
		changeQuarter,
		forceRefresh,
		clearAllCache,
		getCachedData: (studentId, quarter, schoolYear) => getCachedData(studentId, quarter, schoolYear)
	};

	return store;
}

export const studentGradeStore = createStudentGradeStore();


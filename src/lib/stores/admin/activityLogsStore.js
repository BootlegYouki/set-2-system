import { writable } from 'svelte/store';

// Activity logs store with caching
function createActivityLogsStore() {
	const { subscribe, set, update } = writable({
		activities: [],
		isLoading: false,
		error: null,
		lastUpdated: null,
		isInitialized: false,
		hasMoreActivities: true,
		activityLimit: 4,
		loadingMore: false
	});

	return {
		subscribe,
		
		// Initialize with cached data (show immediately)
		init: (cachedData) => {
			if (cachedData) {
				update(state => ({
					...state,
					activities: cachedData.activities,
					activityLimit: cachedData.activityLimit || 4,
					hasMoreActivities: cachedData.hasMoreActivities !== false,
					isInitialized: true,
					isLoading: false
				}));
			}
		},

		// Set loading state (only for initial load if no cache)
		setLoading: (loading) => {
			update(state => ({
				...state,
				isLoading: loading && !state.isInitialized
			}));
		},

		// Set loading more state
		setLoadingMore: (loading) => {
			update(state => ({
				...state,
				loadingMore: loading
			}));
		},

		// Update activities silently (background refresh)
		updateActivities: (newActivities, limit = 4, hasMore = true) => {
			update(state => ({
				...state,
				activities: newActivities,
				activityLimit: limit,
				hasMoreActivities: hasMore,
				isLoading: false,
				loadingMore: false,
				error: null,
				lastUpdated: new Date(),
				isInitialized: true
			}));
			
			// Cache to localStorage
			try {
				localStorage.setItem('activity-logs-cache', JSON.stringify({
					activities: newActivities,
					activityLimit: limit,
					hasMoreActivities: hasMore,
					timestamp: Date.now()
				}));
			} catch (e) {
				console.warn('Failed to cache activity logs:', e);
			}
		},

		// Set error state
		setError: (error) => {
			update(state => ({
				...state,
				error,
				isLoading: false,
				loadingMore: false
			}));
		},

		// Get cached data from localStorage
		getCachedData: () => {
			try {
				const cached = localStorage.getItem('activity-logs-cache');
				if (cached) {
					const { activities, activityLimit, hasMoreActivities, timestamp } = JSON.parse(cached);
					// Cache is valid for 3 minutes (shorter than dashboard since activities change more frequently)
					if (Date.now() - timestamp < 3 * 60 * 1000) {
						return { activities, activityLimit, hasMoreActivities };
					}
				}
			} catch (e) {
				console.warn('Failed to retrieve cached activity logs:', e);
			}
			return null;
		},

		// Clear cache
		clearCache: () => {
			try {
				localStorage.removeItem('activity-logs-cache');
			} catch (e) {
				console.warn('Failed to clear activity logs cache:', e);
			}
		}
	};
}

export const activityLogsStore = createActivityLogsStore();
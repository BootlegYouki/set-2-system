import { writable } from 'svelte/store';

// Store for the currently selected school year (for viewing historical data)
// Default to null or 'current' to imply "follow the system current year"
export const selectedSchoolYear = writable(null);

// Optional: Store for the list of available school years found in the system
export const availableSchoolYears = writable([]);

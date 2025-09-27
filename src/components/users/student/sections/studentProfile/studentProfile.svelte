<script>
	import './studentProfile.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { authStore } from '../../../../../components/login/js/auth.js';
	import { api } from '../../../../../routes/api/helper/api-helper.js';
	import { onMount } from 'svelte';

	// Get basic auth data
	let authState = $state();
	let studentData = $state(null);
	let isLoading = $state(true);
	let error = $state(null);
	
	// Subscribe to auth store changes
	$effect(() => {
		const unsubscribe = authStore.subscribe(value => {
			authState = value;
		});
		return unsubscribe;
	});

	// Fetch complete student data from API
	async function fetchStudentData() {
		try {
			isLoading = true;
			error = null;
			
			if (!authState?.userData?.id) {
				throw new Error('User not authenticated');
			}

			// Fetch complete user data from accounts API - get current user specifically
			const response = await api.get(`/api/accounts?type=student&limit=1000`);
			
			if (!response.success) {
				throw new Error(response.message || 'Failed to fetch student data');
			}

			console.log('API Response:', response);
			console.log('Auth State User Data:', authState.userData);
			console.log('Looking for user ID:', authState.userData.id);
			console.log('Looking for account number:', authState.userData.accountNumber);
			console.log('Available accounts:', response.accounts.map(acc => ({ id: acc.id, name: acc.name, number: acc.number })));

			// Find the current user's data in the accounts list
			const currentUserData = response.accounts.find(account => 
				account.id === authState.userData.id || 
				account.number === authState.userData.accountNumber
			);

			if (!currentUserData) {
				console.error('User not found in accounts list');
				console.error('Auth user ID:', authState.userData.id);
				console.error('Auth account number:', authState.userData.accountNumber);
				console.error('Available account IDs:', response.accounts.map(acc => acc.id));
				console.error('Available account numbers:', response.accounts.map(acc => acc.number));
				throw new Error('Student data not found');
			}

			studentData = currentUserData;
		} catch (err) {
			console.error('Error fetching student data:', err);
			error = err.message;
			toastStore.error(`Failed to load profile data: ${err.message}`);
		} finally {
			isLoading = false;
		}
	}

	// Load student data when component mounts or auth state changes
	$effect(() => {
		if (authState?.userData?.id) {
			fetchStudentData();
		}
	});

	// Dynamic student profile data based on fetched data
	let studentProfile = $derived({
		id: studentData?.number || authState?.userData?.accountNumber || 'N/A',
		name: studentData?.name || authState?.userData?.name || 'Student Name',
		firstName: studentData?.firstName || authState?.userData?.firstName || '',
		lastName: studentData?.lastName || '',
		middleInitial: studentData?.middleInitial || '',
		yearLevel: studentData?.gradeLevel ? `Grade ${studentData.gradeLevel}` : 'Not assigned',
		section: studentData?.section || 'Not assigned',
		email: studentData?.email || 'Not available',
		phone: studentData?.contactNumber || 'Not available',
		address: studentData?.address || 'Not available',
		birthDate: studentData?.birthdate ? new Date(studentData.birthdate).toLocaleDateString('en-US', { 
			year: 'numeric', 
			month: 'long', 
			day: 'numeric' 
		}) : 'Not available',
		age: studentData?.age || 'Not available',
		guardian: studentData?.guardian || 'Not available',
		gender: studentData?.gender || authState?.userData?.gender || 'male',
		academicSummary: {
			gpa: 'Not available', // Will be populated from grades API
			rank: 'Not available', // Will be populated from grades API
			totalStudents: 'Not available', // Will be populated from grades API
			attendance: 'Not available' // Will be populated from attendance API
		},
		subjects: [] // Will be populated from subjects API
	});

	// Calculate total subjects (will be 0 initially until subjects are loaded)
	let totalSubjects = $derived(studentProfile.subjects.length || 'Not available');

	// Modal state and functions
	function openPictureModal() {
		// Make close function globally accessible
		window.handleModalClose = () => {
			modalStore.closeAll();
		};

		modalStore.open('CustomModal', {
			title: 'Change Profile Photo',
			content: `<div class="profile-picture-modal">
				<div class="modal-button-group">
					<button class="modal-action-btn upload-btn" onclick="handleUpload()">
						Upload Photo
					</button>
					<button class="modal-action-btn remove-btn" onclick="handleRemove()">
						Remove Current Photo
					</button>
					<button class="modal-action-btn cancel-btn" onclick="handleModalClose()">
						Cancel
					</button>
				</div>
			</div>`
		}, { 
			size: 'small',
			closable: false
		});
	}

	function handleUpload() {
		// Create a file input element
		const fileInput = document.createElement('input');
		fileInput.type = 'file';
		fileInput.accept = 'image/*';
		fileInput.onchange = (e) => {
			const file = e.target.files[0];
			if (file) {
				// Here you would typically upload the file to your server
				// For now, we'll just show a success message
				toastStore.success(`Profile picture updated successfully!`);
				modalStore.closeAll();
			}
		};
		fileInput.click();
	}

	function handleRemove() {
		modalStore.confirm(
			'Remove Profile Picture',
			'Are you sure you want to remove your profile picture?',
			() => {
				// Here you would typically make an API call to remove the picture
				toastStore.success('Profile picture removed successfully!');
			},
			null,
			{ size: 'small' }
		);
	}
</script>

<div class="profile-container">
	<!-- Error State -->
	{#if error}
		<div class="error-container">
			<div class="error-icon">
				<span class="material-symbols-outlined">error</span>
			</div>
			<p class="error-message">Failed to load profile data: {error}</p>
			<button class="retry-btn" onclick={fetchStudentData}>
				<span class="material-symbols-outlined">refresh</span>
				Retry
			</button>
		</div>
	{:else}
		<!-- Header Section - Always visible -->
		<div class="profile-header">
			<div class="header-content">
				<h1 class="page-title">Student Profile</h1>
				<p class="page-subtitle">Personal Information & Academic Details</p>
			</div>
			<div class="profile-avatar">
				<div class="avatar-circle" onclick={openPictureModal}>
					<span class="material-symbols-outlined">person</span>
					<div class="avatar-overlay">
						<span class="material-symbols-outlined edit-icon">edit</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Student Information Cards -->
		<div class="profile-info-section">
			<h2 class="section-title">Student Information</h2>
			{#if isLoading}
				<div class="profile-loading-container">
					<span class="profile-loader"></span>
					<p class="profile-loading-text">Loading student information...</p>
				</div>
			{:else}
				<div class="info-cards-grid">
					<!-- Student ID Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">badge</span>
						</div>
						<div class="info-content">
							<div class="info-label">Student ID</div>
							<div class="info-value">{studentProfile.id}</div>
						</div>
					</div>

					<!-- Full Name Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">person</span>
						</div>
						<div class="info-content">
							<div class="info-label">Full Name</div>
							<div class="info-value">{studentProfile.name}</div>
						</div>
					</div>

					<!-- Year Level Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">school</span>
						</div>
						<div class="info-content">
							<div class="info-label">Year Level</div>
							<div class="info-value">{studentProfile.yearLevel}</div>
						</div>
					</div>

					<!-- Section Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">group</span>
						</div>
						<div class="info-content">
							<div class="info-label">Section</div>
							<div class="info-value">{studentProfile.section || 'Not assigned'}</div>
						</div>
					</div>

					<!-- Total Subjects Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">menu_book</span>
						</div>
						<div class="info-content">
							<div class="info-label">Total Subjects</div>
							<div class="info-value">{totalSubjects || 'Not available'}</div>
						</div>
					</div>

					<!-- Email Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">email</span>
						</div>
						<div class="info-content">
							<div class="info-label">Email</div>
							<div class="info-value">{studentProfile.email || 'Not provided'}</div>
						</div>
					</div>

					<!-- Contact Number Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">phone</span>
						</div>
						<div class="info-content">
							<div class="info-label">Contact Number</div>
							<div class="info-value">{studentProfile.phone || 'Not provided'}</div>
						</div>
					</div>

					<!-- Address Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">home</span>
						</div>
						<div class="info-content">
							<div class="info-label">Address</div>
							<div class="info-value">{studentProfile.address || 'Not provided'}</div>
						</div>
					</div>

					<!-- Birth Date Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">cake</span>
						</div>
						<div class="info-content">
							<div class="info-label">Birth Date</div>
							<div class="info-value">{studentProfile.birthDate || 'Not provided'}</div>
						</div>
					</div>

					<!-- Age Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">person_outline</span>
						</div>
						<div class="info-content">
							<div class="info-label">Age</div>
							<div class="info-value">{studentProfile.age ? `${studentProfile.age} years old` : 'Not available'}</div>
						</div>
					</div>

					<!-- Guardian Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">family_restroom</span>
						</div>
						<div class="info-content">
							<div class="info-label">Guardian</div>
							<div class="info-value">{studentProfile.guardian || 'Not provided'}</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Academic Performance Section -->
		<div class="profile-academic-section">
			<h2 class="section-title">Academic Performance</h2>
			{#if isLoading}
				<div class="profile-loading-container">
					<span class="profile-loader"></span>
					<p class="profile-loading-text">Loading academic performance...</p>
				</div>
			{:else}
				<div class="info-cards-grid">
					<!-- GPA Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">grade</span>
						</div>
						<div class="info-content">
							<div class="info-label">General Average</div>
							<div class="info-value">{studentProfile.academicSummary.gpa || 'Not available'}</div>
						</div>
					</div>

					<!-- Class Rank Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">leaderboard</span>
						</div>
						<div class="info-content">
							<div class="info-label">Class Rank</div>
							<div class="info-value">{studentProfile.academicSummary.rank && studentProfile.academicSummary.totalStudents ? `${studentProfile.academicSummary.rank} of ${studentProfile.academicSummary.totalStudents}` : 'Not available'}</div>
						</div>
					</div>

					<!-- Attendance Card -->
					<div class="info-card">
						<div class="info-icon">
							<span class="material-symbols-outlined">event_available</span>
						</div>
						<div class="info-content">
							<div class="info-label">Attendance Rate</div>
							<div class="info-value">{studentProfile.academicSummary.attendance || 'Not available'}</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Subjects Section -->
		<div class="profile-subjects-section">
			<h2 class="section-title">Enrolled Subjects</h2>
			{#if isLoading}
				<div class="profile-loading-container">
					<span class="profile-loader"></span>
					<p class="profile-loading-text">Loading enrolled subjects...</p>
				</div>
			{:else if studentProfile.subjects.length > 0}
				<div class="subjects-grid">
					{#each studentProfile.subjects as subject (subject.id)}
						<div class="subject-card">
							<!-- Subject Icon -->
							<div class="subject-icon-column">
								<div class="subject-icon" style="background-color: {subject.color}20; color: {subject.color}">
									<span class="material-symbols-outlined">book</span>
								</div>
							</div>
							
							<!-- Subject Details -->
							<div class="subject-details-column">
								<h3 class="subject-name">{subject.name}</h3>
								<p class="teacher-name">{subject.teacher}</p>
								<div class="subject-id">
									<span class="material-symbols-outlined">tag</span>
									<span class="subject-id-text">{subject.id}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="subjects-empty">
					<span class="material-symbols-outlined">menu_book</span>
					<p>No subjects enrolled yet</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
<script>
	import './studentProfile.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';

	// Sample student profile data - in real app this would come from props or API
	let studentProfile = {
		id: 'STU-2024-001',
		name: 'Maria Isabella Santos',
		yearLevel: 'Grade 10',
		section: 'Einstein',
		schoolYear: '2024-2025',
		email: 'maria.santos@student.school.edu.ph',
		phone: '+63 912 345 6789',
		address: '123 Rizal Street, Barangay San Jose, Quezon City',
		birthDate: 'March 15, 2009',
		guardian: {
			name: 'Roberto Santos',
			relationship: 'Father',
			phone: '+63 917 123 4567',
			email: 'roberto.santos@email.com'
		},
		academicSummary: {
			gpa: '92.5',
			rank: '5th',
			totalStudents: '45',
			attendance: '98%'
		},
		subjects: [
			{
				id: 'MATH-10-001',
				name: 'Mathematics 10',
				teacher: 'Mrs. Ana Rodriguez',
				color: 'var(--school-primary)'
			},
			{
				id: 'SCI-10-001',
				name: 'Science 10',
				teacher: 'Dr. John Dela Cruz',
				color: 'var(--school-secondary)'
			},
			{
				id: 'ENG-10-001',
				name: 'English 10',
				teacher: 'Ms. Sarah Johnson',
				color: 'var(--success)'
			},
			{
				id: 'FIL-10-001',
				name: 'Filipino 10',
				teacher: 'Gng. Carmen Reyes',
				color: 'var(--warning)'
			},
			{
				id: 'AP-10-001',
				name: 'Araling Panlipunan 10',
				teacher: 'Mr. Miguel Torres',
				color: 'var(--info)'
			},
			{
				id: 'MAPEH-10-001',
				name: 'MAPEH 10',
				teacher: 'Ms. Lisa Garcia',
				color: 'var(--school-accent)'
			},
			{
				id: 'TLE-10-001',
				name: 'Technology and Livelihood Education 10',
				teacher: 'Mr. Robert Mendoza',
				color: 'var(--grade-excellent)'
			},
			{
				id: 'ESP-10-001',
				name: 'Edukasyon sa Pagpapakatao 10',
				teacher: 'Mrs. Grace Villanueva',
				color: 'var(--grade-good)'
			}
		]
	};

	// Calculate total subjects
	$: totalSubjects = studentProfile.subjects.length;

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
	<!-- Header Section -->
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
					<div class="info-value">{studentProfile.section}</div>
				</div>
			</div>

			<!-- School Year Card -->
			<div class="info-card">
				<div class="info-icon">
					<span class="material-symbols-outlined">calendar_today</span>
				</div>
				<div class="info-content">
					<div class="info-label">School Year</div>
					<div class="info-value">{studentProfile.schoolYear}</div>
				</div>
			</div>

			<!-- Total Subjects Card -->
			<div class="info-card">
				<div class="info-icon">
					<span class="material-symbols-outlined">menu_book</span>
				</div>
				<div class="info-content">
					<div class="info-label">Total Subjects</div>
					<div class="info-value">{totalSubjects}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Academic Performance Section -->
	<div class="profile-academic-section">
		<h2 class="section-title">Academic Performance</h2>
		<div class="info-cards-grid">
			<!-- GPA Card -->
			<div class="info-card">
				<div class="info-icon">
					<span class="material-symbols-outlined">grade</span>
				</div>
				<div class="info-content">
					<div class="info-label">General Average</div>
					<div class="info-value">{studentProfile.academicSummary.gpa}</div>
				</div>
			</div>

			<!-- Class Rank Card -->
			<div class="info-card">
				<div class="info-icon">
					<span class="material-symbols-outlined">leaderboard</span>
				</div>
				<div class="info-content">
					<div class="info-label">Class Rank</div>
					<div class="info-value">{studentProfile.academicSummary.rank} of {studentProfile.academicSummary.totalStudents}</div>
				</div>
			</div>

			<!-- Attendance Card -->
			<div class="info-card">
				<div class="info-icon">
					<span class="material-symbols-outlined">event_available</span>
				</div>
				<div class="info-content">
					<div class="info-label">Attendance Rate</div>
					<div class="info-value">{studentProfile.academicSummary.attendance}</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Subjects Section -->
	<div class="profile-subjects-section">
		<h2 class="section-title">Enrolled Subjects</h2>
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
	</div>
</div>

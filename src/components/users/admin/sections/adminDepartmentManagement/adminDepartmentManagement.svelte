<script>
	import './adminDepartmentManagement.css';
	import { modalStore } from '../../../../common/js/modalStore.js';
	import { toastStore } from '../../../../common/js/toastStore.js';
	import { onMount } from 'svelte';

	// Department creation state
	let isCreating = false;
	let departmentName = '';
	let departmentCode = '';

	// Department management state
	let departments = [];
	let filteredDepartments = [];
	let searchTerm = '';

	// Edit department state
	let editingDepartmentId = null;
	let editDepartmentName = '';
	let editDepartmentCode = '';
	let isUpdating = false;

	// Subject assignment state
	let selectedDepartmentForSubjects = null;
	let availableSubjects = [];
	let selectedSubjects = [];
	let isSubjectDropdownOpen = false;

	// Teacher assignment state
	let selectedDepartmentForTeachers = null;
	let availableTeachers = [];
	let selectedTeachers = [];
	let isTeacherDropdownOpen = false;

	// Mock data
	const mockSubjects = [
		{ id: 1, name: 'Mathematics', code: 'MATH', gradeLevel: 'Grade 7' },
		{ id: 2, name: 'Science', code: 'SCI', gradeLevel: 'Grade 7' },
		{ id: 3, name: 'English', code: 'ENG', gradeLevel: 'Grade 7' },
		{ id: 4, name: 'Filipino', code: 'FIL', gradeLevel: 'Grade 7' },
		{ id: 5, name: 'Araling Panlipunan', code: 'AP', gradeLevel: 'Grade 7' },
		{ id: 6, name: 'Technology and Livelihood Education', code: 'TLE', gradeLevel: 'Grade 7' },
		{ id: 7, name: 'Music, Arts, Physical Education, and Health', code: 'MAPEH', gradeLevel: 'Grade 7' },
		{ id: 8, name: 'Values Education', code: 'VE', gradeLevel: 'Grade 7' },
		{ id: 9, name: 'Algebra', code: 'ALG', gradeLevel: 'Grade 8' },
		{ id: 10, name: 'Biology', code: 'BIO', gradeLevel: 'Grade 8' }
	];

	const mockTeachers = [
		{ id: 1, name: 'Maria Santos', email: 'maria.santos@school.edu', subject: 'Mathematics' },
		{ id: 2, name: 'Juan Dela Cruz', email: 'juan.delacruz@school.edu', subject: 'Science' },
		{ id: 3, name: 'Ana Rodriguez', email: 'ana.rodriguez@school.edu', subject: 'English' },
		{ id: 4, name: 'Carlos Mendoza', email: 'carlos.mendoza@school.edu', subject: 'Filipino' },
		{ id: 5, name: 'Elena Reyes', email: 'elena.reyes@school.edu', subject: 'Araling Panlipunan' },
		{ id: 6, name: 'Roberto Garcia', email: 'roberto.garcia@school.edu', subject: 'TLE' },
		{ id: 7, name: 'Sofia Villanueva', email: 'sofia.villanueva@school.edu', subject: 'MAPEH' },
		{ id: 8, name: 'Miguel Torres', email: 'miguel.torres@school.edu', subject: 'Values Education' }
	];

	const mockDepartments = [
		{
			id: 1,
			name: 'Mathematics Department',
			code: 'MATH-DEPT',
			subjects: [1, 9], // Math and Algebra
			teachers: [1], // Maria Santos
			createdAt: '2024-01-15'
		},
		{
			id: 2,
			name: 'Science Department',
			code: 'SCI-DEPT',
			subjects: [2, 10], // Science and Biology
			teachers: [2], // Juan Dela Cruz
			createdAt: '2024-01-16'
		},
		{
			id: 3,
			name: 'Language Arts Department',
			code: 'LANG-DEPT',
			subjects: [3, 4], // English and Filipino
			teachers: [3, 4], // Ana Rodriguez, Carlos Mendoza
			createdAt: '2024-01-17'
		}
	];

	// Initialize data
	onMount(() => {
		departments = [...mockDepartments];
		availableSubjects = [...mockSubjects];
		availableTeachers = [...mockTeachers];
		filterDepartments();
	});

	// Computed properties
	$: filterDepartments();

	// Functions
	function filterDepartments() {
		if (searchTerm.trim() === '') {
			filteredDepartments = [...departments];
		} else {
			filteredDepartments = departments.filter(dept =>
				dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				dept.code.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
	}

	// Department CRUD operations
	async function handleCreateDepartment() {
		if (!departmentName.trim() || !departmentCode.trim()) {
			toastStore.error('Please fill in all required fields');
			return;
		}

		// Check if department code already exists
		if (departments.some(dept => dept.code.toLowerCase() === departmentCode.toLowerCase())) {
			toastStore.error('Department code already exists');
			return;
		}

		isCreating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			const newDepartment = {
				id: Date.now(),
				name: departmentName.trim(),
				code: departmentCode.trim().toUpperCase(),
				subjects: [],
				teachers: [],
				createdAt: new Date().toISOString().split('T')[0]
			};

			departments = [...departments, newDepartment];

			// Reset form
		departmentName = '';
		departmentCode = '';

			toastStore.success('Department created successfully');
		} catch (error) {
			console.error('Error creating department:', error);
			toastStore.error('Failed to create department. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	function toggleEditForm(department) {
		if (editingDepartmentId === department.id) {
			// Close the form
			editingDepartmentId = null;
			editDepartmentName = '';
		editDepartmentCode = '';
		} else {
			// Open the form
			editingDepartmentId = department.id;
			editDepartmentName = department.name;
			editDepartmentCode = department.code;
		}
	}

	async function handleUpdateDepartment() {
		if (!editDepartmentName.trim() || !editDepartmentCode.trim()) {
			toastStore.error('Please fill in all required fields');
			return;
		}

		// Check if department code already exists (excluding current department)
		if (departments.some(dept => 
			dept.id !== editingDepartmentId && 
			dept.code.toLowerCase() === editDepartmentCode.toLowerCase()
		)) {
			toastStore.error('Department code already exists');
			return;
		}

		isUpdating = true;

		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 1000));

			departments = departments.map(dept => {
				if (dept.id === editingDepartmentId) {
					return {
						...dept,
						name: editDepartmentName.trim(),
						code: editDepartmentCode.trim().toUpperCase()
					};
				}
				return dept;
			});

			// Close edit form
			editingDepartmentId = null;
			editDepartmentName = '';
			editDepartmentCode = '';

			toastStore.success('Department updated successfully');
		} catch (error) {
			console.error('Error updating department:', error);
			toastStore.error('Failed to update department. Please try again.');
		} finally {
			isUpdating = false;
		}
	}

	function handleRemoveDepartment(department) {
		modalStore.confirm(
			'Remove Department',
			`<p>Are you sure you want to remove the department <strong>"${department.name}"</strong>?</p>
			 <p class="warning-text">This action will also remove all subject and teacher assignments.</p>`,
			async () => {
				try {
					// Simulate API call
					await new Promise(resolve => setTimeout(resolve, 500));

					departments = departments.filter(dept => dept.id !== department.id);
					toastStore.success('Department removed successfully');
				} catch (error) {
					console.error('Error removing department:', error);
					toastStore.error('Failed to remove department. Please try again.');
				}
			},
			null,
			{ size: 'small' }
		);
	}

	// Subject assignment functions
	function openSubjectAssignment(department) {
		selectedDepartmentForSubjects = department;
		selectedSubjects = department.subjects.map(subjectId => 
			availableSubjects.find(subject => subject.id === subjectId)
		).filter(Boolean);
	}

	function closeSubjectAssignment() {
		selectedDepartmentForSubjects = null;
		selectedSubjects = [];
		isSubjectDropdownOpen = false;
	}

	function toggleSubjectSelection(subject) {
		const index = selectedSubjects.findIndex(s => s.id === subject.id);
		if (index > -1) {
			selectedSubjects = selectedSubjects.filter(s => s.id !== subject.id);
		} else {
			selectedSubjects = [...selectedSubjects, subject];
		}
	}

	async function saveSubjectAssignments() {
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));

			departments = departments.map(dept => {
				if (dept.id === selectedDepartmentForSubjects.id) {
					return {
						...dept,
						subjects: selectedSubjects.map(s => s.id)
					};
				}
				return dept;
			});

			toastStore.success('Subject assignments updated successfully');
			closeSubjectAssignment();
		} catch (error) {
			console.error('Error updating subject assignments:', error);
			toastStore.error('Failed to update subject assignments. Please try again.');
		}
	}

	// Teacher assignment functions
	function openTeacherAssignment(department) {
		selectedDepartmentForTeachers = department;
		selectedTeachers = department.teachers.map(teacherId => 
			availableTeachers.find(teacher => teacher.id === teacherId)
		).filter(Boolean);
	}

	function closeTeacherAssignment() {
		selectedDepartmentForTeachers = null;
		selectedTeachers = [];
		isTeacherDropdownOpen = false;
	}

	function toggleTeacherSelection(teacher) {
		const index = selectedTeachers.findIndex(t => t.id === teacher.id);
		if (index > -1) {
			selectedTeachers = selectedTeachers.filter(t => t.id !== teacher.id);
		} else {
			selectedTeachers = [...selectedTeachers, teacher];
		}
	}

	async function saveTeacherAssignments() {
		try {
			// Simulate API call
			await new Promise(resolve => setTimeout(resolve, 500));

			departments = departments.map(dept => {
				if (dept.id === selectedDepartmentForTeachers.id) {
					return {
						...dept,
						teachers: selectedTeachers.map(t => t.id)
					};
				}
				return dept;
			});

			toastStore.success('Teacher assignments updated successfully');
			closeTeacherAssignment();
		} catch (error) {
			console.error('Error updating teacher assignments:', error);
			toastStore.error('Failed to update teacher assignments. Please try again.');
		}
	}

	// Utility functions
	function getDepartmentSubjects(department) {
		return department.subjects.map(subjectId => 
			availableSubjects.find(subject => subject.id === subjectId)
		).filter(Boolean);
	}

	function getDepartmentTeachers(department) {
		return department.teachers.map(teacherId => 
			availableTeachers.find(teacher => teacher.id === teacherId)
		).filter(Boolean);
	}

	// Handle click outside to close dropdowns
	function handleClickOutside(event) {
		if (!event.target.closest('.subject-dropdown-container')) {
			isSubjectDropdownOpen = false;
		}
		if (!event.target.closest('.teacher-dropdown-container')) {
			isTeacherDropdownOpen = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="dept-mgmt-container">
	<!-- Header -->
	<div class="dept-mgmt-header">
		<div class="dept-mgmt-header-content">
			<h1 class="dept-mgmt-page-title">Department Management</h1>
			<p class="dept-mgmt-page-subtitle">Create and manage academic departments, assign subjects and teachers</p>
		</div>
	</div>

	<!-- Create Department Section -->
	<div class="dept-mgmt-create-section">
		<h2 class="dept-mgmt-section-title">Create New Department</h2>
		<p class="dept-mgmt-section-subtitle">Add a new academic department to organize subjects and teachers</p>

		<div class="dept-mgmt-create-form">
			<div class="dept-mgmt-form-row">
				<div class="dept-mgmt-form-group">
					<label for="departmentName" class="dept-mgmt-form-label">Department Name *</label>
					<input
						id="departmentName"
						type="text"
						bind:value={departmentName}
						placeholder="e.g., Mathematics Department"
						class="dept-mgmt-form-input"
						disabled={isCreating}
					/>
				</div>

				<div class="dept-mgmt-form-group">
					<label for="departmentCode" class="dept-mgmt-form-label">Department Code *</label>
					<input
						id="departmentCode"
						type="text"
						bind:value={departmentCode}
						placeholder="e.g., MATH-DEPT"
						class="dept-mgmt-form-input"
						disabled={isCreating}
					/>
				</div>
			</div>

			<!-- Submit Button -->
			<div class="dept-mgmt-form-actions">
				<button 
					type="submit" 
					class="dept-mgmt-btn-primary"
					disabled={isCreating || !departmentName || !departmentCode}
					on:click={handleCreateDepartment}
				>
					{#if isCreating}
						Creating...
					{:else}
						<span class="material-symbols-outlined">add_ad</span>
						Create Department
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Subject Assignment Modal -->
{#if selectedDepartmentForSubjects}
	<div class="dept-mgmt-modal-overlay" on:click={closeSubjectAssignment}>
		<div class="dept-mgmt-modal-content" on:click|stopPropagation>
			<div class="dept-mgmt-modal-header">
				<h3 class="dept-mgmt-modal-title">Assign Subjects to {selectedDepartmentForSubjects.name}</h3>
				<button class="dept-mgmt-modal-close" on:click={closeSubjectAssignment}>
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="dept-mgmt-modal-body">
				<p class="dept-mgmt-modal-description">Select subjects to assign to this department</p>
				
				<div class="dept-mgmt-subject-selection">
					{#each availableSubjects as subject}
						<label class="dept-mgmt-checkbox-item">
							<input
								type="checkbox"
								checked={selectedSubjects.some(s => s.id === subject.id)}
								on:change={() => toggleSubjectSelection(subject)}
							/>
							<span class="dept-mgmt-checkbox-label">
								<strong>{subject.name}</strong> ({subject.code})
								<span class="dept-mgmt-subject-grade">{subject.gradeLevel}</span>
							</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="dept-mgmt-modal-actions">
				<button class="dept-mgmt-btn dept-mgmt-btn-primary" on:click={saveSubjectAssignments}>
					<span class="material-symbols-outlined">save</span>
					Save Assignments
				</button>
				<button class="dept-mgmt-btn dept-mgmt-btn-outline" on:click={closeSubjectAssignment}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Teacher Assignment Modal -->
{#if selectedDepartmentForTeachers}
	<div class="dept-mgmt-modal-overlay" on:click={closeTeacherAssignment}>
		<div class="dept-mgmt-modal-content" on:click|stopPropagation>
			<div class="dept-mgmt-modal-header">
				<h3 class="dept-mgmt-modal-title">Assign Teachers to {selectedDepartmentForTeachers.name}</h3>
				<button class="dept-mgmt-modal-close" on:click={closeTeacherAssignment}>
					<span class="material-symbols-outlined">close</span>
				</button>
			</div>

			<div class="dept-mgmt-modal-body">
				<p class="dept-mgmt-modal-description">Select teachers to assign to this department</p>
				
				<div class="dept-mgmt-teacher-selection">
					{#each availableTeachers as teacher}
						<label class="dept-mgmt-checkbox-item">
							<input
								type="checkbox"
								checked={selectedTeachers.some(t => t.id === teacher.id)}
								on:change={() => toggleTeacherSelection(teacher)}
							/>
							<span class="dept-mgmt-checkbox-label">
								<strong>{teacher.name}</strong>
								<span class="dept-mgmt-teacher-email">{teacher.email}</span>
								<span class="dept-mgmt-teacher-subject">Subject: {teacher.subject}</span>
							</span>
						</label>
					{/each}
				</div>
			</div>

			<div class="dept-mgmt-modal-actions">
				<button class="dept-mgmt-btn dept-mgmt-btn-primary" on:click={saveTeacherAssignments}>
					<span class="material-symbols-outlined">save</span>
					Save Assignments
				</button>
				<button class="dept-mgmt-btn dept-mgmt-btn-outline" on:click={closeTeacherAssignment}>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}
<script>
  import './teacherClassList.css';
  import Toast from '../../../../../common/Toast.svelte';
  import GradingSpreadsheet from './GradingSpreadsheet.svelte';
  
  // Props
  let { selectedClass, onBackToClassManagement } = $props();
  
  // Reactive class information using Svelte 5 runes
  let classInfo = $derived(selectedClass ? {
    yearLevel: selectedClass.yearLevel,
    sectionName: selectedClass.sectionName,
    gradeName: `Grade ${selectedClass.yearLevel}`,
    subject: "Mathematics", // This would come from actual data
    section: `Grade ${selectedClass.yearLevel} - ${selectedClass.sectionName}`,
    quarter: "1st Quarter",
    totalStudents: 35
  } : {
    yearLevel: 7,
    sectionName: "Section A",
    gradeName: "Grade 7",
    subject: "Mathematics",
    section: "Grade 9 - Section A",
    quarter: "1st Quarter",
    totalStudents: 35
  });

  // Sample student data
  let students = $state([
    { id: "2024001", name: "Juan Dela Cruz", writtenWork: [85, 90, 88], performanceTasks: [92, 87], quarterlyAssessment: [89] },
    { id: "2024002", name: "Maria Santos", writtenWork: [92, 88, 95], performanceTasks: [90, 94], quarterlyAssessment: [91] },
    { id: "2024003", name: "Jose Rizal", writtenWork: [78, 82, 80], performanceTasks: [85, 83], quarterlyAssessment: [84] },
    { id: "2024004", name: "Ana Garcia", writtenWork: [95, 93, 97], performanceTasks: [96, 92], quarterlyAssessment: [94] },
    { id: "2024005", name: "Carlos Mendoza", writtenWork: [87, 89, 85], performanceTasks: [88, 90], quarterlyAssessment: [87] }
  ]);

  // Grading configuration
  let gradingConfig = $state({
    writtenWork: {
      count: 3,
      weight: 0.30, // 30%
      label: "Written Work",
      totals: [30, 25, 40] // Total scores for each WW assessment
    },
    performanceTasks: {
      count: 2,
      weight: 0.50, // 50%
      label: "Performance Tasks",
      totals: [50, 60] // Total scores for each PT assessment
    },
    quarterlyAssessment: {
      count: 1,
      weight: 0.20, // 20%
      label: "Quarterly Assessment",
      totals: [100] // Total scores for each QA assessment
    }
  });

  // Toast state
  let toastMessage = $state('');
  let toastType = $state('error');
  let showToast = $state(false);

  // Column configuration options
  let columnOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Close dropdowns when clicking outside - removed since no longer needed
  function handleClickOutside(event) {
    // This function is no longer needed since we removed dropdowns
    // Keeping it empty to avoid breaking existing event listeners
  }

  // Dropdown toggle functions - no longer needed
  // Removed dropdown functions since we're using buttons now

  // Add/Remove column functions
  function addColumn(category) {
    if (gradingConfig[category].count < 10) {
      gradingConfig[category].count += 1;
      adjustStudentData();
    }
  }

  function removeColumn(category) {
    if (gradingConfig[category].count > 1) {
      gradingConfig[category].count -= 1;
      adjustStudentData();
    }
  }

  // Adjust student data based on column configuration
  function adjustStudentData() {
    students = students.map(student => {
      const newStudent = {
        ...student,
        writtenWork: Array(gradingConfig.writtenWork.count).fill(0).map((_, i) => student.writtenWork?.[i] || 0),
        performanceTasks: Array(gradingConfig.performanceTasks.count).fill(0).map((_, i) => student.performanceTasks?.[i] || 0),
        quarterlyAssessment: Array(gradingConfig.quarterlyAssessment.count).fill(0).map((_, i) => student.quarterlyAssessment?.[i] || 0)
      };
      return newStudent;
    });
  }

  // Calculate average with totals support
  function calculateAverage(scores, totals = null) {
    const validScores = scores.filter(score => score !== null && score !== undefined && score !== '');
    if (validScores.length === 0) return '';
    
    // If totals are provided, calculate percentage-based average
    if (totals && totals.length > 0) {
      let sum = 0;
      for (let i = 0; i < validScores.length; i++) {
        const score = parseFloat(validScores[i]);
        const total = totals[i] || 100; // Default to 100 if total not specified
        const percentage = (score / total) * 100;
        sum += percentage;
      }
      return Math.round((sum / validScores.length) * 100) / 100;
    } else {
      // Original calculation for backward compatibility
      const sum = validScores.reduce((acc, score) => acc + parseFloat(score), 0);
      return Math.round((sum / validScores.length) * 100) / 100;
    }
  }

  // Calculate final grade
  function calculateFinalGrade(student) {
    const wwAvg = calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals);
    const ptAvg = calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals);
    const qaAvg = calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals);
    
    if (wwAvg === '' || ptAvg === '' || qaAvg === '') return '';
    
    const finalGrade = (wwAvg * gradingConfig.writtenWork.weight) + 
                      (ptAvg * gradingConfig.performanceTasks.weight) + 
                      (qaAvg * gradingConfig.quarterlyAssessment.weight);
    
    return Math.round(finalGrade * 100) / 100;
  }

  // Get grade status
  function getGradeStatus(grade) {
    if (grade >= 90) return 'excellent';
    if (grade >= 85) return 'good';
    if (grade >= 80) return 'satisfactory';
    if (grade >= 75) return 'needs-improvement';
    return 'no-grade';
  }

  // Show toast notification
  function showToastNotification(message, type = 'error') {
    toastMessage = message;
    toastType = type;
    showToast = true;
  }

  // Validate if input is a valid number
  function isValidNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0 && num <= 100;
  }

  // Handle grade input
  function updateGrade(studentIndex, category, scoreIndex, event) {
    const inputValue = event.target.value.trim();
    
    // Allow empty values
    if (inputValue === '') {
      students[studentIndex][category][scoreIndex] = 0;
      return;
    }
    
    // Validate if it's a valid number
    if (!isValidNumber(inputValue)) {
      showToastNotification('Please enter a valid number between 0 and 100', 'error');
      // Reset to previous value or 0
      event.target.value = students[studentIndex][category][scoreIndex] || '';
      return;
    }
    
    const value = parseFloat(inputValue);
    students[studentIndex][category][scoreIndex] = Math.min(100, Math.max(0, value));
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="class-management-container">
  <!-- Header Section -->
  <div class="classlist-page-header">
    <div class="header-content">
      <div class="header-navigation">
        <button class="back-button" onclick={() => onBackToClassManagement && onBackToClassManagement()}>
          <span class="material-symbols-outlined">arrow_back</span>
          <span>Back to Class Management</span>
        </button>
      </div>
      <h1 class="classlist-page-title">Class Grading Sheet</h1>
      <p class="classlist-page-subtitle">{classInfo.section} • {classInfo.subject} • {classInfo.quarter}</p>
    </div>
    <div class="classlist-stats">
      <div class="stat-item">
        <span class="material-symbols-outlined">group</span>
        <span>{classInfo.totalStudents} Students</span>
      </div>
    </div>
  </div>

  <!-- Grading Configuration Section -->
  <div class="grading-config-section">
    <h2 class="config-title">Grading Configuration</h2>
    <div class="config-grid">
      <!-- Written Work Configuration -->
      <div class="config-item">
        <label class="config-label">Written Work ({Math.round(gradingConfig.writtenWork.weight * 100)}%)</label>
        <div class="classlist-column-controls">
          <div class="classlist-column-count">
            <span class="classlist-column-text">{gradingConfig.writtenWork.count} Column{gradingConfig.writtenWork.count !== 1 ? 's' : ''}</span>
          </div>
          <div class="classlist-action-buttons">
            <button 
              type="button"
              class="classlist-add-column-button"
              onclick={() => addColumn('writtenWork')}
              disabled={gradingConfig.writtenWork.count >= 10}
              title="Add Column"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
            <button 
              type="button"
              class="classlist-remove-column-button"
              onclick={() => removeColumn('writtenWork')}
              disabled={gradingConfig.writtenWork.count <= 1}
              title="Remove Column"
            >
              <span class="material-symbols-outlined">remove</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Performance Tasks Configuration -->
      <div class="config-item">
        <label class="config-label">Performance Tasks ({Math.round(gradingConfig.performanceTasks.weight * 100)}%)</label>
        <div class="classlist-column-controls">
          <div class="classlist-column-count">
            <span class="classlist-column-text">{gradingConfig.performanceTasks.count} Column{gradingConfig.performanceTasks.count !== 1 ? 's' : ''}</span>
          </div>
          <div class="classlist-action-buttons">
            <button 
              type="button"
              class="classlist-add-column-button"
              onclick={() => addColumn('performanceTasks')}
              disabled={gradingConfig.performanceTasks.count >= 10}
              title="Add Column"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
            <button 
              type="button"
              class="classlist-remove-column-button"
              onclick={() => removeColumn('performanceTasks')}
              disabled={gradingConfig.performanceTasks.count <= 1}
              title="Remove Column"
            >
              <span class="material-symbols-outlined">remove</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Quarterly Assessment Configuration -->
      <div class="config-item">
        <label class="config-label">Quarterly Assessment ({Math.round(gradingConfig.quarterlyAssessment.weight * 100)}%)</label>
        <div class="classlist-column-controls">
          <div class="classlist-column-count">
            <span class="classlist-column-text">{gradingConfig.quarterlyAssessment.count} Column{gradingConfig.quarterlyAssessment.count !== 1 ? 's' : ''}</span>
          </div>
          <div class="classlist-action-buttons">
            <button 
              type="button"
              class="classlist-add-column-button"
              onclick={() => addColumn('quarterlyAssessment')}
              disabled={gradingConfig.quarterlyAssessment.count >= 10}
              title="Add Column"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
            <button 
              type="button"
              class="classlist-remove-column-button"
              onclick={() => removeColumn('quarterlyAssessment')}
              disabled={gradingConfig.quarterlyAssessment.count <= 1}
              title="Remove Column"
            >
              <span class="material-symbols-outlined">remove</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Submit Section -->
  <div class="classlist-submit-section">
    <button class="classlist-submit-button" type="button">
      <span class="material-symbols-outlined">send</span>
      <span>Submit to Section Adviser</span>
    </button>
  </div>

  <!-- Grading Spreadsheet Section -->
  <GradingSpreadsheet bind:students bind:gradingConfig />
</div>

<!-- Toast Notification -->
{#if showToast}
  <Toast message={toastMessage} type={toastType} onClose={() => showToast = false} />
{/if}
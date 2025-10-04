<script>
  import { onMount } from 'svelte';
  import { authStore } from '../../../../login/js/auth.js';
  import './teacherAdvisoryClass.css';
  import Odometer from '../../../../common/Odometer.svelte';
  
  // State variables
  let loading = $state(true);
  let error = $state(null);
  let advisoryData = $state(null);
  let students = $state([]);

  // Fetch advisory data from API
  async function fetchAdvisoryData() {
    try {
      loading = true;
      error = null;

      const response = await fetch('/api/teacher-advisory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': $authStore.userData?.id?.toString() || '',
          'x-user-account-number': $authStore.userData?.accountNumber || '',
          'x-user-name': encodeURIComponent($authStore.userData?.name || '')
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        advisoryData = result.data.advisoryData;
        
        if (result.data.students) {
          // Transform the API data to match the component's expected format
          students = result.data.students.map(student => ({
            id: student.id.toString(),
            name: student.name,
            studentNumber: student.studentNumber,
            gradeLevel: student.gradeLevel,
            gradesVerified: student.gradesVerified,
            finalGrades: student.finalGrades || [], // Add final grades data
            grades: student.subjects.map(subject => ({
              subject: subject.subject,
              teacher: subject.teacher,
              grade: subject.average,
              quarter: "1st Quarter",
              verified: subject.verified,
              submittedDate: subject.grades.length > 0 ? 
                new Date(subject.grades[0].gradedAt || subject.grades[0].dateGiven).toISOString().split('T')[0] : 
                null,
              gradeItems: subject.grades
            }))
          }));
        }
      } else {
        error = result.error || 'Failed to fetch advisory data';
      }
    } catch (err) {
      console.error('Error fetching advisory data:', err);
      error = 'Failed to load advisory data. Please try again.';
    } finally {
      loading = false;
    }
  }

  // Load data when component mounts
  onMount(() => {
    if ($authStore.userData?.id) {
      fetchAdvisoryData();
    }
  });

  // Calculate student averages (only use final grades, no fallback to regular grades)
  const studentsWithAverages = $derived(students.map(student => {
    if (!student.finalGrades || student.finalGrades.length === 0) {
      return {
        ...student,
        average: 0,
        verifiedGradesCount: 0,
        pendingGradesCount: student.grades?.length || 0
      };
    }
    
    // Only use final grades - no fallback to regular grades
    const total = student.finalGrades.reduce((sum, finalGrade) => {
      return sum + (finalGrade.finalGrade || 0);
    }, 0);
    const average = total / student.finalGrades.length;
    const verifiedGrades = student.grades?.filter(grade => grade.verified) || [];
    return {
      ...student,
      average: Math.round(average * 100) / 100,
      verifiedGradesCount: verifiedGrades.length,
      pendingGradesCount: (student.grades?.length || 0) - verifiedGrades.length
    };
  }));

  // Update advisory data class average when students change
  $effect(() => {
    if (advisoryData && studentsWithAverages.length > 0) {
      const validAverages = studentsWithAverages
        .map(s => s.average)
        .filter(avg => avg > 0);
      
      if (validAverages.length > 0) {
        advisoryData.averageGrade = Math.round((validAverages.reduce((sum, avg) => sum + avg, 0) / validAverages.length) * 100) / 100;
      }
    }
  });

  // Verification functions
  function verifyStudentGrades(studentId) {
    students = students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          gradesVerified: true,
          grades: student.grades.map(grade => ({ ...grade, verified: true }))
        };
      }
      return student;
    });
  }

  function unverifyStudentGrades(studentId) {
    students = students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          gradesVerified: false,
          grades: student.grades.map(grade => ({ ...grade, verified: false }))
        };
      }
      return student;
    });
  }

  function verifyIndividualGrade(studentId, subject) {
    students = students.map(student => {
      if (student.id === studentId) {
        const updatedGrades = student.grades.map(grade => {
          if (grade.subject === subject) {
            return { ...grade, verified: true };
          }
          return grade;
        });
        const allVerified = updatedGrades.every(grade => grade.verified);
        return {
          ...student,
          grades: updatedGrades,
          gradesVerified: allVerified
        };
      }
      return student;
    });
  }

  function unverifyIndividualGrade(studentId, subject) {
    students = students.map(student => {
      if (student.id === studentId) {
        const updatedGrades = student.grades.map(grade => {
          if (grade.subject === subject) {
            return { ...grade, verified: false };
          }
          return grade;
        });
        return {
          ...student,
          grades: updatedGrades,
          gradesVerified: false
        };
      }
      return student;
    });
  }

  // Bulk verification functions
  function verifyAllStudents() {
    students = students.map(student => ({
      ...student,
      gradesVerified: true,
      grades: student.grades.map(grade => ({ ...grade, verified: true }))
    }));
  }

  function unverifyAllStudents() {
    students = students.map(student => ({
      ...student,
      gradesVerified: false,
      grades: student.grades.map(grade => ({ ...grade, verified: false }))
    }));
  }

  // Stats configuration
  let statsConfig = [
    {
      id: 'students',
      label: 'Total Students',
      getValue: () => advisoryData?.totalStudents || 0,
      icon: 'people',
      color: 'var(--school-primary)'
    },
    {
      id: 'subjects',
      label: 'Subjects Tracked',
      getValue: () => advisoryData?.subjectsCount || 0,
      icon: 'book',
      color: 'var(--school-secondary)'
    },
    {
      id: 'average',
      label: 'Class Average',
      getValue: () => advisoryData?.averageGrade || 0,
      icon: 'grade',
      color: 'var(--school-accent)'
    }
  ];

  // Selected student for detailed view
  // UI state
  let selectedStudent = $state(null);

  function selectStudent(student) {
    selectedStudent = selectedStudent?.id === student.id ? null : student;
  }

  function getGradeColor(grade) {
    if (grade >= 90) return 'var(--success)';
    if (grade >= 80) return 'var(--school-accent)';
    if (grade >= 75) return 'var(--warning)';
    return 'var(--error)';
  }

  function getGradeStatus(grade) {
    if (grade >= 90) return 'Excellent';
    if (grade >= 80) return 'Good';
    if (grade >= 75) return 'Satisfactory';
    return 'Needs Improvement';
  }
</script>

<div class="advisory-class-container">
  <!-- Header Section -->
  <div class="advisory-page-header">
    <div class="header-content">
      <h1 class="advisory-page-title">Advisory Class Dashboard</h1>
      <div class="advisory-class-info">
        <div class="class-detail">
          <span class="material-symbols-outlined">school</span>
          <span>{advisoryData?.sectionName || 'Loading...'}</span>
        </div>
        <div class="class-detail">
          <span class="material-symbols-outlined">meeting_room</span>
          <span>{advisoryData?.roomName || 'Loading...'}</span>
        </div>
      </div>
      <div class="verification-info">
      <span class="material-symbols-outlined">info</span>
      <div class="verification-text">
        <span>Use verification controls to approve grades for student portal visibility</span>
      </div>
    </div>
    </div>
  </div>

  <!-- Stats Cards Section -->
  <div class="advisory-stats-section">
    <div class="advisory-stats-grid">
      {#each statsConfig as stat (stat.id)}
        <div class="advisory-stat-card">
          <div class="advisory-stat-icon" style="background-color: {stat.color}20; color: {stat.color}">
            <span class="material-symbols-outlined">{stat.icon}</span>
          </div>
          <div class="stat-content">
            <div class="advisory-stat-value" style="color: {stat.color}">
              <Odometer value={stat.getValue()} format="d" duration={2000} animation="ease-out" />
              {#if stat.id === 'average'}%{/if}
            </div>
            <div class="advisory-stat-label">{stat.label}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Students Section -->
  <div class="students-section">
    <div class="section-header">
      <button class="refresh-btn" on:click={fetchAdvisoryData}>
        <span class="material-symbols-outlined">refresh</span>
        Refresh
      </button>
      <!-- Bulk verification controls -->
      <div class="bulk-controls">
        <button class="verify-all-btn" on:click={verifyAllStudents}>
          <span class="material-symbols-outlined">verified</span>
          Verify All Grades
        </button>
        <button class="unverify-all-btn" on:click={unverifyAllStudents}>
          <span class="material-symbols-outlined">cancel</span>
          Unverify All Grades
        </button>
      </div>
    </div>
    <div class="advisory-students-grid">
      {#if loading}
        <div class="students-loading">
          <div class="dashboard-loader"></div>
          <p>Loading students and grades...</p>
        </div>
      {:else if error}
        <div class="students-error">
          <span class="material-symbols-outlined error-icon">error</span>
          <p>Error loading students: {error}</p>
        </div>
      {:else if studentsWithAverages.length === 0}
        <div class="students-empty">
          <span class="material-symbols-outlined">school</span>
          <p>No students found in this advisory class</p>
        </div>
      {:else}
        {#each studentsWithAverages as student (student.id)}
        <div class="advisory-student-card {student.gradesVerified ? 'verified' : 'pending'}" class:selected={selectedStudent?.id === student.id}>
          <div class="student-header" on:click={() => selectStudent(student)}>
            <div class="student-header-content">
              <div class="student-title-section">
                <h3 class="student-title">{student.name} · Grade {student.gradeLevel || '7'}</h3>
              </div>
              <div class="student-info-row">
                <div class="student-info-item">
                  <span class="material-symbols-outlined">person</span>
                  <span>Student #{student.studentNumber}</span>
                </div>
                <div class="student-info-item">
                  <span class="material-symbols-outlined">{student.gradesVerified ? 'verified' : 'pending'}</span>
                  <span>{student.gradesVerified ? 'Verified' : 'Pending'}</span>
                </div>
                <div class="student-info-item">
                  <span class="material-symbols-outlined">assignment</span>
                  <span>{student.verifiedGradesCount} Verified, {student.pendingGradesCount} Pending</span>
                </div>
              </div>
            </div>
            <div class="student-average">
              <div class="average-score" style="color: {getGradeColor(student.average)}">
                {student.average}%
              </div>
            </div>
            <div class="expand-icon">
              <span class="material-symbols-outlined">
                {selectedStudent?.id === student.id ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </div>

          {#if selectedStudent?.id === student.id}
            <div class="student-grades">
              <!-- Regular Grades Section -->
              <div class="grades-header">
                <h4 class="grades-title">Subject Grades (1st Quarter)</h4>
                <div class="student-verification-controls">
                  {#if student.gradesVerified}
                    <button class="unverify-btn" on:click|stopPropagation={() => unverifyStudentGrades(student.id)}>
                      <span class="material-symbols-outlined">cancel</span>
                      Unverify All
                    </button>
                  {:else}
                    <button class="verify-btn" on:click|stopPropagation={() => verifyStudentGrades(student.id)}>
                      <span class="material-symbols-outlined">verified</span>
                      Verify All
                    </button>
                  {/if}
                </div>
              </div>
              <div class="grades-grid">
                {#each student.grades as grade (grade.subject)}
                  {@const finalGrade = student.finalGrades?.find(fg => fg.subjectName === grade.subject)}
                  <button class="grade-item {grade.verified ? 'verified' : 'unverified'}" 
                          on:click={() => grade.verified ? unverifyIndividualGrade(student.id, grade.subject) : verifyIndividualGrade(student.id, grade.subject)}>
                    <div class="grade-overlay">
                      <div class="overlay-content">
                        <span class="material-symbols-outlined">
                          {grade.verified ? 'cancel' : 'verified'}
                        </span>
                        <div class="overlay-text">
                          {grade.verified ? 'Unverify' : 'Verify'}
                        </div>
                      </div>
                    </div>
                    <div class="grade-item-header">
                      <div class="grade-info">
                        <div class="subject-name">{grade.subject}</div>
                        <div class="subject-teacher">by {grade.teacher}</div>
                        {#if grade.submittedDate}
                          <small class="submitted-date">Submitted: {grade.submittedDate}</small>
                        {/if}
                      </div>
                      <div class="grade-controls">
                          {#if finalGrade}
                            <div class="grade-score-display" style="color: {getGradeColor(finalGrade.finalGrade)}">
                              {finalGrade.finalGrade}%
                            </div>
                          {:else}
                            <div class="grade-score-display" style="color: #666;">
                              Not Available
                            </div>
                          {/if}
                        </div>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
      {/if}
    </div>
  </div>
</div>
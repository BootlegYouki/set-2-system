<script>
  import './teacherAdvisoryClass.css';
  import Odometer from '../../../../common/Odometer.svelte';
  
  // Sample advisory class data - in real app this would come from props or API
  let advisoryData = {
    sectionName: "Grade 9 - Section A",
    roomName: "Room 201",
    totalStudents: 32,
    averageGrade: 87.5,
    subjectsCount: 8
  };

  // Sample students with their grades from different subject teachers
  let students = [
    {
      id: "2024-001",
      name: "Alice Johnson",
      studentNumber: "2024-001234",
      gradesVerified: false,
      grades: [
        { subject: "Mathematics", teacher: "Mr. Smith", grade: 92, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-15" },
        { subject: "Science", teacher: "Ms. Davis", grade: 88, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-14" },
        { subject: "English", teacher: "Mrs. Brown", grade: 85, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-16" },
        { subject: "History", teacher: "Mr. Wilson", grade: 90, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-13" },
        { subject: "Filipino", teacher: "Ms. Cruz", grade: 87, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-17" },
        { subject: "PE", teacher: "Coach Martinez", grade: 95, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-12" },
        { subject: "Arts", teacher: "Ms. Garcia", grade: 89, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-18" },
        { subject: "Computer", teacher: "Mr. Lee", grade: 93, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-11" }
      ]
    },
    {
      id: "2024-002",
      name: "Bob Chen",
      studentNumber: "2024-001235",
      gradesVerified: true,
      grades: [
        { subject: "Mathematics", teacher: "Mr. Smith", grade: 78, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-15" },
        { subject: "Science", teacher: "Ms. Davis", grade: 82, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-14" },
        { subject: "English", teacher: "Mrs. Brown", grade: 80, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-16" },
        { subject: "History", teacher: "Mr. Wilson", grade: 85, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-13" },
        { subject: "Filipino", teacher: "Ms. Cruz", grade: 79, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-17" },
        { subject: "PE", teacher: "Coach Martinez", grade: 90, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-12" },
        { subject: "Arts", teacher: "Ms. Garcia", grade: 83, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-18" },
        { subject: "Computer", teacher: "Mr. Lee", grade: 88, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-11" }
      ]
    },
    {
      id: "2024-003",
      name: "Carol Martinez",
      studentNumber: "2024-001236",
      gradesVerified: false,
      grades: [
        { subject: "Mathematics", teacher: "Mr. Smith", grade: 95, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-15" },
        { subject: "Science", teacher: "Ms. Davis", grade: 91, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-14" },
        { subject: "English", teacher: "Mrs. Brown", grade: 88, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-16" },
        { subject: "History", teacher: "Mr. Wilson", grade: 92, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-13" },
        { subject: "Filipino", teacher: "Ms. Cruz", grade: 90, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-17" },
        { subject: "PE", teacher: "Coach Martinez", grade: 98, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-12" },
        { subject: "Arts", teacher: "Ms. Garcia", grade: 94, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-18" },
        { subject: "Computer", teacher: "Mr. Lee", grade: 96, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-11" }
      ]
    },
    {
      id: "2024-004",
      name: "David Rodriguez",
      studentNumber: "2024-001237",
      gradesVerified: false,
      grades: [
        { subject: "Mathematics", teacher: "Mr. Smith", grade: 84, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-15" },
        { subject: "Science", teacher: "Ms. Davis", grade: 86, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-14" },
        { subject: "English", teacher: "Mrs. Brown", grade: 82, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-16" },
        { subject: "History", teacher: "Mr. Wilson", grade: 88, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-13" },
        { subject: "Filipino", teacher: "Ms. Cruz", grade: 85, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-17" },
        { subject: "PE", teacher: "Coach Martinez", grade: 92, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-12" },
        { subject: "Arts", teacher: "Ms. Garcia", grade: 87, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-18" },
        { subject: "Computer", teacher: "Mr. Lee", grade: 89, quarter: "1st Quarter", verified: false, submittedDate: "2024-01-11" }
      ]
    },
    {
      id: "2024-005",
      name: "Emma Thompson",
      studentNumber: "2024-001238",
      gradesVerified: true,
      grades: [
        { subject: "Mathematics", teacher: "Mr. Smith", grade: 91, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-15" },
        { subject: "Science", teacher: "Ms. Davis", grade: 89, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-14" },
        { subject: "English", teacher: "Mrs. Brown", grade: 93, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-16" },
        { subject: "History", teacher: "Mr. Wilson", grade: 87, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-13" },
        { subject: "Filipino", teacher: "Ms. Cruz", grade: 88, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-17" },
        { subject: "PE", teacher: "Coach Martinez", grade: 94, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-12" },
        { subject: "Arts", teacher: "Ms. Garcia", grade: 91, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-18" },
        { subject: "Computer", teacher: "Mr. Lee", grade: 92, quarter: "1st Quarter", verified: true, submittedDate: "2024-01-11" }
      ]
    }
  ];

  // Calculate student averages (show all grades, track verification status)
  $: studentsWithAverages = students.map(student => {
    const total = student.grades.reduce((sum, grade) => sum + grade.grade, 0);
    const average = total / student.grades.length;
    const verifiedGrades = student.grades.filter(grade => grade.verified);
    return {
      ...student,
      average: Math.round(average * 100) / 100,
      verifiedGradesCount: verifiedGrades.length,
      pendingGradesCount: student.grades.length - verifiedGrades.length
    };
  });

  // Calculate class statistics (show all grades)
  $: {
    const allAverages = studentsWithAverages.map(s => s.average);
    advisoryData.averageGrade = Math.round((allAverages.reduce((sum, avg) => sum + avg, 0) / allAverages.length) * 100) / 100;
  }

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
      getValue: () => advisoryData.totalStudents,
      icon: 'people',
      color: 'var(--school-primary)'
    },
    {
      id: 'subjects',
      label: 'Subjects Tracked',
      getValue: () => advisoryData.subjectsCount,
      icon: 'book',
      color: 'var(--school-secondary)'
    },
    {
      id: 'average',
      label: 'Class Average',
      getValue: () => advisoryData.averageGrade,
      icon: 'analytics',
      color: 'var(--success)'
    }
  ];

  // Selected student for detailed view
  let selectedStudent = null;

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
          <span>{advisoryData.sectionName}</span>
        </div>
        <div class="class-detail">
          <span class="material-symbols-outlined">meeting_room</span>
          <span>{advisoryData.roomName}</span>
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
      <h2 class="advisory-section-title">Students & Grade Overview</h2>
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
                  <div class="grade-item {grade.verified ? 'verified' : 'unverified'}">
                    <div class="grade-item-header">
                      <div class="grade-info">
                        <div class="subject-name">{grade.subject}</div>
                        <div class="subject-teacher">by {grade.teacher}</div>
                        {#if grade.submittedDate}
                          <small class="submitted-date">Submitted: {grade.submittedDate}</small>
                        {/if}
                      </div>
                      <div class="grade-controls">
                          <div class="grade-score-display" style="color: {getGradeColor(grade.grade)}">
                            {grade.grade}%
                          </div>  
                        {#if grade.verified}
                          <button class="unverify-grade-btn" on:click|stopPropagation={() => unverifyIndividualGrade(student.id, grade.subject)}>
                            <span class="material-symbols-outlined">cancel</span>
                          </button>
                        {:else}
                          <button class="verify-grade-btn" on:click|stopPropagation={() => verifyIndividualGrade(student.id, grade.subject)}>
                            <span class="material-symbols-outlined">verified</span>
                          </button>
                        {/if}

                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
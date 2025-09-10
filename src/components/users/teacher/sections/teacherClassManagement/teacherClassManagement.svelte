<script>
  import './teacherClassManagement.css';
  import Odometer from '../../../../common/Odometer.svelte';
  
  // Sample data - in real app this would come from props or API
  let teacherData = {
    name: "Prof. Maria Santos",
    yearLevels: [7, 8, 9, 10], // Grade 7 to 10
    totalSections: 8,
    totalStudents: 240,
    averagePerSection: 30
  };

  // Dynamic stats configuration
  let statsConfig = [
    {
      id: 'year-levels',
      label: 'Year Levels',
      getValue: () => teacherData.yearLevels.length,
      icon: 'school',
      color: 'var(--school-primary)'
    },
    {
      id: 'sections',
      label: 'Total Sections',
      getValue: () => teacherData.totalSections,
      icon: 'class',
      color: 'var(--school-secondary)'
    },
    {
      id: 'students',
      label: 'Total Students',
      getValue: () => teacherData.totalStudents,
      icon: 'people',
      color: 'var(--success)'
    },
    {
      id: 'average',
      label: 'Average Per Section',
      getValue: () => teacherData.averagePerSection,
      icon: 'analytics',
      color: 'var(--school-accent)'
    }
  ];

  // Sample class data organized by year level
  let classData = [
    {
      yearLevel: 7,
      gradeName: "Grade 7",
      sections: [
        { name: "Section A", students: 32, subject: "Mathematics" },
        { name: "Section B", students: 28, subject: "Mathematics" }
      ]
    },
    {
      yearLevel: 8,
      gradeName: "Grade 8", 
      sections: [
        { name: "Section A", students: 30, subject: "Mathematics" },
        { name: "Section C", students: 25, subject: "Science" }
      ]
    },
    {
      yearLevel: 9,
      gradeName: "Grade 9",
      sections: [
        { name: "Section A", students: 35, subject: "Mathematics" },
        { name: "Section B", students: 33, subject: "Physics" },
        { name: "Section C", students: 31, subject: "Chemistry" },
        { name: "Section D", students: 29, subject: "Biology" },
        { name: "Section E", students: 32, subject: "Mathematics" }
      ]
    },
    {
      yearLevel: 10,
      gradeName: "Grade 10",
      sections: [
        { name: "Section A", students: 29, subject: "Advanced Mathematics" },
        { name: "Section B", students: 28, subject: "Chemistry" }
      ]
    }
  ];

  // Calculate statistics
  $: {
    teacherData.totalSections = classData.reduce((sum, year) => sum + year.sections.length, 0);
    teacherData.totalStudents = classData.reduce((sum, year) => 
      sum + year.sections.reduce((sectionSum, section) => sectionSum + section.students, 0), 0);
    teacherData.averagePerSection = teacherData.totalSections > 0 
      ? Math.round(teacherData.totalStudents / teacherData.totalSections) 
      : 0;
  }


</script>

<div class="class-management-container">
  <!-- Header Section -->
  <div class="page-header">
    <div class="header-content">
      <h1 class="page-title">Class Management Dashboard</h1>
      <p class="page-subtitle">Overview of your teaching assignments and student distribution</p>
    </div>
  </div>

  <!-- Stats Cards Section -->
  <div class="stats-section">
    <div class="stats-grid">
      {#each statsConfig as stat (stat.id)}
        <div class="stat-card">
          <div class="stat-icon" style="background-color: {stat.color}20; color: {stat.color}">
            <span class="material-symbols-outlined">{stat.icon}</span>
          </div>
          <div class="stat-content">
            <div class="stat-value" style="color: {stat.color}">
              <Odometer value={stat.getValue()} format="d" duration={2000} animation="ease-out" />
            </div>
            <div class="stat-label">{stat.label}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Year Levels and Sections Section -->
  <div class="classes-section">
    <h2 class="section-title">Year Levels & Sections</h2>
    <div class="year-levels-grid">
      {#each classData as yearData (yearData.yearLevel)}
        <div class="year-level-container">
          <!-- Year Level Header -->
          <div class="year-level-header">
            <div class="year-level-info">
              <div class="year-level-icon">
                <span class="material-symbols-outlined">school</span>
              </div>
              <div class="year-level-details">
                <h3 class="year-level-title">{yearData.gradeName}</h3>
                <p class="year-level-summary">{yearData.sections.length} section{yearData.sections.length !== 1 ? 's' : ''} • {yearData.sections.reduce((sum, section) => sum + section.students, 0)} students</p>
              </div>
            </div>
          </div>

          <!-- Sections Grid -->
          <div class="sections-grid">
            {#each yearData.sections as section (section.name)}
              <div class="section-card">
                <div class="section-name">{section.name}</div>
                <div class="section-students">
                  {section.students} students
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
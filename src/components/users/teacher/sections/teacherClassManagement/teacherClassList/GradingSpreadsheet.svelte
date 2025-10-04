<script>
  import { onMount, untrack } from 'svelte';
  import * as XLSX from 'xlsx';
  import { toastStore } from '../../../../../common/js/toastStore.js';
  import { authenticatedFetch } from '../../../../../../routes/api/helper/api-helper.js';
  import { authStore } from '../../../../../login/js/auth.js';
  import CustomTotalScoreModal from './CustomTotalScoreModal.svelte';

  // Props
  let { 
    students = [], 
    sectionId, 
    subjectId, 
    gradingPeriodId = 1,
    gradingConfig = {
      writtenWork: { 
        count: 3,
        weight: 0.30,
        totals: [] // Array to store individual column totals
      },
      performanceTasks: { 
        count: 3,
        weight: 0.50,
        totals: [] // Array to store individual column totals
      },
      quarterlyAssessment: { 
        count: 1,
        weight: 0.20,
        totals: [] // Array to store individual column totals
      }
    }
  } = $props();

  // State for save functionality
  let isSaving = $state(false);
  let saveMessage = $state('');
  let saveSuccess = $state(false);
  let autoSaveInterval = null;
  let autoSaveTimeout = null; // For debounced auto-save on data changes
  
  // New state for tracking data changes and save status
  let hasUnsavedChanges = $state(false);
  let isDataSaved = $state(true); // Start as saved since no changes initially
  let originalData = $state(null); // Store original data for comparison
  let spreadsheetContainer;
  let selectedCell = $state(null);
  let isEditing = $state(false);
  let editValue = $state('');
  let justStartedEditing = $state(false);
  let copiedData = $state(null);
  let invalidCells = $state(new Set()); // Track cells with invalid input that were converted to 0

  // Initialize spreadsheet data
  let spreadsheetData = $state([]);
  let headers = $state([]);

  // Initialize spreadsheet data
  function formatScore(score) {
    if (score === null || score === undefined || score === '') return '';
    const num = parseFloat(score);
    if (isNaN(num)) return score;
    // Remove trailing zeros and unnecessary decimal point
    return num % 1 === 0 ? num.toString() : num.toString();
  }

  // Function to create a deep copy of student data for comparison
  function createDataSnapshot() {
    return JSON.parse(JSON.stringify(students.map(student => ({
      id: student.id,
      writtenWork: [...student.writtenWork],
      performanceTasks: [...student.performanceTasks],
      quarterlyAssessment: [...student.quarterlyAssessment]
    }))));
  }

  // Function to check if data has changed
  function checkForDataChanges() {
    if (!originalData) return false;
    
    const currentData = createDataSnapshot();
    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(originalData);
    
    hasUnsavedChanges = hasChanges;
    isDataSaved = !hasChanges;
    
    return hasChanges;
  }

  function initializeSpreadsheetData() {
    const headers = ['Student ID', 'Student Name'];
    
    // Add Written Work columns
    for (let i = 1; i <= gradingConfig.writtenWork.count; i++) {
      headers.push(getColumnHeaderWithTotal('writtenWork', i - 1));
    }
    headers.push('WW Avg');
    
    // Add Performance Tasks columns
    for (let i = 1; i <= gradingConfig.performanceTasks.count; i++) {
      headers.push(getColumnHeaderWithTotal('performanceTasks', i - 1));
    }
    headers.push('PT Avg');
    
    // Add Quarterly Assessment columns
    for (let i = 1; i <= gradingConfig.quarterlyAssessment.count; i++) {
      headers.push(getColumnHeaderWithTotal('quarterlyAssessment', i - 1));
    }
    headers.push('QA Avg');
    headers.push('Final Grade');

    spreadsheetData = [headers];

    // Add student data rows
    students.forEach(student => {
      const row = [student.id, student.name];
      
      // Written Work scores
      for (let i = 0; i < gradingConfig.writtenWork.count; i++) {
        row.push(formatScore(student.writtenWork[i]));
      }
      row.push(calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals, 'writtenWork'));
      
      // Performance Tasks scores
      for (let i = 0; i < gradingConfig.performanceTasks.count; i++) {
        row.push(formatScore(student.performanceTasks[i]));
      }
      row.push(calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals, 'performanceTasks'));
      
      // Quarterly Assessment scores
      for (let i = 0; i < gradingConfig.quarterlyAssessment.count; i++) {
        row.push(formatScore(student.quarterlyAssessment[i]));
      }
      row.push(calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals, 'quarterlyAssessment'));
      
      // Final Grade
      row.push(calculateFinalGrade(student));
      
      spreadsheetData.push(row);
    });

    // Store original data snapshot if not already stored
    if (!originalData && students.length > 0) {
      originalData = createDataSnapshot();
      isDataSaved = true;
      hasUnsavedChanges = false;
    }
  }

  function calculateAverage(scores, totals = null, assessmentType = null) {
    const validScores = scores.filter(score => score !== null && score !== undefined && score !== '');
    if (validScores.length === 0) return '';
    
    let sum = 0;
    let totalPossible = 0;
    
    // If totals are provided, calculate percentage-based average
    if (totals && totals.length > 0) {
      for (let i = 0; i < validScores.length; i++) {
        const score = parseFloat(validScores[i]);
        const total = totals[i] || 100; // Default to 100 if total not specified
        const percentage = (score / total) * 100;
        sum += percentage;
        totalPossible += 100;
      }
      const average = Math.round((sum / validScores.length) * 100) / 100;
      return formatScore(average);
    } else {
      // Original calculation for backward compatibility
      sum = validScores.reduce((acc, score) => acc + parseFloat(score), 0);
      const average = Math.round((sum / validScores.length) * 100) / 100;
      return formatScore(average);
    }
  }

  function calculateFinalGrade(student) {
    const wwAvg = calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals, 'writtenWork');
    const ptAvg = calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals, 'performanceTasks');
    const qaAvg = calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals, 'quarterlyAssessment');
    
    if (wwAvg === '' || ptAvg === '' || qaAvg === '') return '';
    
    // Parse the formatted averages back to numbers for calculation
    const wwNum = parseFloat(wwAvg) || 0;
    const ptNum = parseFloat(ptAvg) || 0;
    const qaNum = parseFloat(qaAvg) || 0;
    
    const finalGrade = (wwNum * gradingConfig.writtenWork.weight) + 
                      (ptNum * gradingConfig.performanceTasks.weight) + 
                      (qaNum * gradingConfig.quarterlyAssessment.weight);
    
    const roundedGrade = Math.round(finalGrade * 100) / 100;
    return formatScore(roundedGrade);
  }

  function handleCellClick(rowIndex, colIndex, event) {
    if (colIndex < 2) return; // Don't allow editing of student info columns
    
    selectedCell = { row: rowIndex, col: colIndex };
    
    // Don't automatically start editing on click - let user navigate first
    isEditing = false;
  }

  function handleGlobalKeydown(event) {
    if (!selectedCell) return;
    
    // Don't handle global keydown when editing - let the input handler take care of it
    if (isEditing) return;

    const { row, col } = selectedCell;
    
    // If currently editing, only handle Enter, Escape, and number/letter keys
    if (isEditing) {
      if (event.key === 'Enter') {
        event.preventDefault();
        isEditing = false;
        updateSpreadsheetData();
        // Move to next row, same column
        if (row < spreadsheetData.length - 1) {
          selectedCell = { row: row + 1, col };
          if (!isCalculatedColumn(col) && col > 1) {
            isEditing = true;
            editValue = '';
          }
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        isEditing = false;
        editValue = '';
      } else if (event.key === 'Tab') {
        event.preventDefault();
        isEditing = false;
        updateSpreadsheetData();
        
        // Move to next editable cell
        let nextCol = col + 1;
        while (nextCol < spreadsheetData[0].length && isCalculatedColumn(nextCol)) {
          nextCol++;
        }
        
        if (nextCol < spreadsheetData[0].length) {
          selectedCell = { row, col: nextCol };
          if (!isCalculatedColumn(nextCol)) {
            isEditing = true;
            editValue = '';
          }
        } else if (row < spreadsheetData.length - 1) {
          // Move to first editable column of next row
          selectedCell = { row: row + 1, col: 2 };
          isEditing = true;
          editValue = '';
        }
      } else if (/^[0-9.]$/.test(event.key)) {
        // For number keys, replace the content only if just started editing
        event.preventDefault();
        if (justStartedEditing) {
          editValue = event.key;
          justStartedEditing = false;
        } else {
          editValue += event.key;
        }
      } else if (event.key === 'Backspace' || event.key === 'Delete') {
        // Allow backspace and delete to work normally
        justStartedEditing = false;
        return;
      } else if (event.key.length === 1) {
        // For other single character keys, replace content only if just started editing
        event.preventDefault();
        if (justStartedEditing) {
          editValue = event.key;
          justStartedEditing = false;
        } else {
          editValue += event.key;
        }
      }
      return;
    }

    // Navigation when not editing
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        if (row > 1) {
          selectedCell = { row: row - 1, col };
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (row < spreadsheetData.length - 1) {
          selectedCell = { row: row + 1, col };
        }
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (col > 0) {
          selectedCell = { row, col: col - 1 };
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (col < spreadsheetData[0].length - 1) {
          selectedCell = { row, col: col + 1 };
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (!isCalculatedColumn(col) && col > 1) {
          isEditing = true;
          editValue = event.key;
          justStartedEditing = false; // First character already entered
        }
        break;
      case 'Tab':
        event.preventDefault();
        // Move to next editable cell
        let nextCol = col + 1;
        while (nextCol < spreadsheetData[0].length && isCalculatedColumn(nextCol)) {
          nextCol++;
        }
        
        if (nextCol < spreadsheetData[0].length) {
          selectedCell = { row, col: nextCol };
        } else if (row < spreadsheetData.length - 1) {
          // Move to first editable column of next row
          selectedCell = { row: row + 1, col: 2 };
        }
        break;
      default:
         // Start editing with number or letter keys
         if (/^[0-9.]$/.test(event.key) && !isCalculatedColumn(col) && col > 1) {
           event.preventDefault();
           isEditing = true;
           editValue = event.key;
           justStartedEditing = false; // First character already entered
         } else if (event.key.length === 1 && !isCalculatedColumn(col) && col > 1) {
           event.preventDefault();
           isEditing = true;
           editValue = event.key;
           justStartedEditing = false; // First character already entered
         }
         break;
    }
  }

  function isCalculatedColumn(colIndex) {
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    return header?.includes('Avg') || header === 'Final Grade';
  }

  // Check if column is an assessment column (clickable for total scores)
  function isAssessmentColumn(colIndex) {
    return getColumnMapping(colIndex) !== null;
  }

  function getColumnType(colIndex) {
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    
    if (colIndex < 2) return 'student-info';
    if (header?.includes('Avg') || header === 'Final Grade') return 'calculated';
    if (header?.startsWith('WW')) return 'written-work';
    if (header?.startsWith('PT')) return 'performance-task';
    if (header?.startsWith('QA')) return 'quarterly-assessment';
    
    return 'default';
  }

  // Handle header click to open total score modal
  function handleHeaderClick(colIndex, event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Map column index to assessment type and column index
    const columnMapping = getColumnMapping(colIndex);
    if (columnMapping) {
      const { assessmentType, columnIndex } = columnMapping;
      const columnName = getColumnName(assessmentType, columnIndex);
      openTotalScoreModal(assessmentType, columnIndex, columnName);
    }
  }

  // Get assessment type and column index from spreadsheet column index
  function getColumnMapping(colIndex) {
    let currentIndex = 2; // Start after Student ID and Student Name
    
    // Check Written Work columns
    for (let i = 0; i < gradingConfig.writtenWork.count; i++) {
      if (currentIndex === colIndex) {
        return { assessmentType: 'writtenWork', columnIndex: i };
      }
      currentIndex++;
    }
    currentIndex++; // Skip WW Avg
    
    // Check Performance Tasks columns
    for (let i = 0; i < gradingConfig.performanceTasks.count; i++) {
      if (currentIndex === colIndex) {
        return { assessmentType: 'performanceTasks', columnIndex: i };
      }
      currentIndex++;
    }
    currentIndex++; // Skip PT Avg
    
    // Check Quarterly Assessment columns
    for (let i = 0; i < gradingConfig.quarterlyAssessment.count; i++) {
      if (currentIndex === colIndex) {
        return { assessmentType: 'quarterlyAssessment', columnIndex: i };
      }
      currentIndex++;
    }
    
    return null; // Not an assessment column
  }

  // State for custom modal
  let modalVisible = $state(false);
  let modalAssessmentType = $state('');
  let modalColumnIndex = $state(0);
  let modalColumnName = $state('');
  let modalCurrentTotal = $state('');

  // Open total score modal
  function openTotalScoreModal(assessmentType, columnIndex, columnName) {
    modalAssessmentType = assessmentType;
    modalColumnIndex = columnIndex;
    modalColumnName = getColumnName(assessmentType, columnIndex);
    modalCurrentTotal = getTotalForColumn(assessmentType, columnIndex);
    modalVisible = true;
  }

  // Update total scores and recalculate
  function updateTotalScores(assessmentType, columnIndex, newTotal) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !gradingConfig[assessmentType]) {
      console.error('Invalid gradingConfig or assessmentType:', assessmentType);
      return;
    }
    
    // Initialize totals array if it doesn't exist
    if (!gradingConfig[assessmentType].totals) {
      gradingConfig[assessmentType].totals = [];
    }
    
    // Update the specific column total
    gradingConfig[assessmentType].totals[columnIndex] = newTotal;
    
    // Trigger reactivity
    gradingConfig = { ...gradingConfig };
    
    // Recalculate spreadsheet data
    initializeSpreadsheetData();
  }

  // Handle column rename
  function handleColumnRename(assessmentType, columnIndex, newName) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !gradingConfig[assessmentType]) {
      console.error('Invalid gradingConfig or assessmentType:', assessmentType);
      toastStore.error('Cannot rename column. Invalid configuration.');
      return;
    }
    
    // Initialize column names array if it doesn't exist
    if (!gradingConfig[assessmentType].columnNames) {
      gradingConfig[assessmentType].columnNames = [];
    }
    
    // Update the specific column name
    gradingConfig[assessmentType].columnNames[columnIndex] = newName;
    
    // Trigger reactivity
    gradingConfig = { ...gradingConfig };
    
    // Recalculate spreadsheet data to reflect new name
    initializeSpreadsheetData();
    
    toastStore.success(`Column renamed to "${newName}"`);
  }

  // Handle column removal
  async function handleColumnRemove(assessmentType, columnIndex) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !gradingConfig[assessmentType]) {
      console.error('Invalid gradingConfig or assessmentType:', assessmentType);
      toastStore.error('Cannot remove column. Invalid configuration.');
      return;
    }
    
    // Check if we can remove (must have at least 1 column)
    if (gradingConfig[assessmentType].count <= 1) {
      toastStore.error('Cannot remove column. At least one column is required.');
      return;
    }

    try {
      // Map category names to category IDs
      const categoryMap = {
        'writtenWork': 1,
        'performanceTasks': 2,
        'quarterlyAssessment': 3
      };

      const categoryId = categoryMap[assessmentType];
      if (!categoryId) {
        console.error('Invalid assessment type:', assessmentType);
        toastStore.error('Invalid assessment type.');
        return;
      }

      // Call API to remove grade item from database
      const response = await fetch('/api/grades/grade-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': $authStore.userData?.id?.toString() || '',
          'x-user-account-number': $authStore.userData?.accountNumber || '',
          'x-user-name': encodeURIComponent($authStore.userData?.name || '')
        },
        body: JSON.stringify({
          action: 'remove',
          section_id: sectionId,
          subject_id: subjectId,
          grading_period_id: gradingPeriodId,
          category_id: categoryId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to remove grade item:', errorData.error);
        toastStore.error('Failed to remove column from database: ' + errorData.error);
        return;
      }

      const result = await response.json();
      console.log('Grade item removed successfully:', result);

      // Update UI only after successful database operation
      // Decrease column count
      gradingConfig[assessmentType].count -= 1;

      // Remove from totals array if it exists
      if (gradingConfig[assessmentType].totals) {
        gradingConfig[assessmentType].totals.splice(columnIndex, 1);
      }

      // Remove from column names array if it exists
      if (gradingConfig[assessmentType].columnNames) {
        gradingConfig[assessmentType].columnNames.splice(columnIndex, 1);
      }

      // Remove from column positions array if it exists
      if (gradingConfig[assessmentType].columnPositions) {
        gradingConfig[assessmentType].columnPositions.splice(columnIndex, 1);
      }

      // Update student data to remove the column
      students = students.map(student => {
        const newStudent = { ...student };
        if (newStudent[assessmentType] && Array.isArray(newStudent[assessmentType])) {
          newStudent[assessmentType].splice(columnIndex, 1);
        }
        return newStudent;
      });

      // Trigger reactivity
      gradingConfig = { ...gradingConfig };
      
      toastStore.success('Column removed successfully');
    } catch (error) {
      console.error('Error removing column:', error);
      toastStore.error('Failed to remove column: ' + error.message);
    }
  }

  // Get existing column names for validation
  function getExistingColumnNames(assessmentType) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !assessmentType || !gradingConfig[assessmentType]) {
      return [];
    }
    
    const names = [];
    
    // Add default column names
    for (let i = 1; i <= gradingConfig[assessmentType].count; i++) {
      const defaultName = getColumnName(assessmentType, i - 1);
      names.push(defaultName);
    }
    
    // Add custom column names if they exist
    if (gradingConfig[assessmentType].columnNames) {
      gradingConfig[assessmentType].columnNames.forEach((name, index) => {
        if (name && name.trim()) {
          names[index] = name.trim();
        }
      });
    }
    
    return names;
  }

  // Get column name with total score (for headers)
  function getColumnHeaderWithTotal(assessmentType, columnIndex) {
    const columnName = getColumnName(assessmentType, columnIndex);
    const totalScore = gradingConfig[assessmentType].totals[columnIndex] || 100;
    return `${columnName} - ${totalScore}`;
  }

  // Get column name (custom or default)
  function getColumnName(assessmentType, columnIndex) {
    // Check if custom name exists
    if (gradingConfig[assessmentType].columnNames && 
        gradingConfig[assessmentType].columnNames[columnIndex]) {
      return gradingConfig[assessmentType].columnNames[columnIndex];
    }
    
    // Return default name using original position numbers
    const prefix = assessmentType === 'writtenWork' ? 'WW' : 
                   assessmentType === 'performanceTasks' ? 'PT' : 'QA';
    
    // Use columnPositions if available, otherwise fall back to sequential numbering
    if (gradingConfig[assessmentType].columnPositions && 
        gradingConfig[assessmentType].columnPositions[columnIndex] !== undefined) {
      return `${prefix}${gradingConfig[assessmentType].columnPositions[columnIndex]}`;
    }
    
    return `${prefix}${columnIndex + 1}`;
  }

  // Check if column can be removed
  function canRemoveColumn(assessmentType) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !assessmentType || !gradingConfig[assessmentType]) {
      return false;
    }
    return gradingConfig[assessmentType].count > 1;
  }

  // Helper function to get current total for a specific column
  function getTotalForColumn(assessmentType, columnIndex) {
    // Check if gradingConfig and assessmentType exist
    if (!gradingConfig || !gradingConfig[assessmentType]) {
      return '';
    }
    
    if (!gradingConfig[assessmentType].totals) {
      return '';
    }
    return gradingConfig[assessmentType].totals[columnIndex] || '';
  }

  // Close modal
  function closeModal() {
    modalVisible = false;
    modalAssessmentType = '';
    modalColumnIndex = 0;
    modalColumnName = '';
    modalCurrentTotal = '';
  }

  function handleCellInput(rowIndex, colIndex, event) {
    const value = event.target.value;
    const numValue = parseFloat(value);
    
    // Validate input is a number
    if (value !== '' && (isNaN(numValue) || numValue < 0)) {
      event.target.value = spreadsheetData[rowIndex][colIndex] || '';
      return;
    }
    
    // Get column type and validate against total if applicable
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    
    // Check if this is a raw score column and validate against total
    if (header && !header.includes('Avg') && header !== 'Final Grade' && colIndex > 1) {
      let assessmentType = null;
      let assessmentIndex = -1;
      
      if (header.startsWith('WW')) {
        assessmentType = 'Written Work';
        assessmentIndex = parseInt(header.substring(2)) - 1;
      } else if (header.startsWith('PT')) {
        assessmentType = 'Performance Task';
        assessmentIndex = parseInt(header.substring(2)) - 1;
      } else if (header.startsWith('QA')) {
        assessmentType = 'Quarterly Assessment';
        assessmentIndex = parseInt(header.substring(2)) - 1;
      }
      
      // Validate against total score
      if (assessmentType && assessmentIndex >= 0) {
        const totals = gradingConfig[assessmentType]?.totals;
        const maxScore = totals?.[assessmentIndex];
        
        if (maxScore && numValue > maxScore) {
          // Show error and revert
           // Note: Toast functionality would need to be passed from parent component
           alert(`Score cannot exceed ${maxScore} points for ${header}`);
           event.target.value = spreadsheetData[rowIndex + 1][colIndex] || '';
           return;
        }
      }
    }
    
    // Update the data
    spreadsheetData[rowIndex][colIndex] = value;
    
    // Update the original student data
    updateStudentData(rowIndex, colIndex, value);
    
    // Recalculate averages and final grades
    recalculateRow(rowIndex);
  }

  function updateStudentData(rowIndex, colIndex, value) {
    const studentIndex = rowIndex - 1; // Subtract 1 for header row
    if (studentIndex < 0 || studentIndex >= students.length) return;
    
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    
    // Helper function to parse value and return 0 for invalid input
    const parseValueOrZero = (val) => {
      if (!val || val.trim() === '') return null;
      const parsed = parseFloat(val);
      
      // Get the maximum score for this column
      let maxScore = null;
      if (header?.startsWith('WW')) {
        const columnIndex = parseInt(header.replace('WW', '')) - 1;
        maxScore = gradingConfig.writtenWork.totals?.[columnIndex];
      } else if (header?.startsWith('PT')) {
        const columnIndex = parseInt(header.replace('PT', '')) - 1;
        maxScore = gradingConfig.performanceTasks.totals?.[columnIndex];
      } else if (header?.startsWith('QA')) {
        const columnIndex = parseInt(header.replace('QA', '')) - 1;
        maxScore = gradingConfig.quarterlyAssessment.totals?.[columnIndex];
      }
      
      // Validate input: return 0 if invalid, negative, or exceeds maximum
      return isNaN(parsed) || parsed < 0 || (maxScore && parsed > maxScore) ? 0 : parsed;
    };
    
    if (header?.startsWith('WW') && !header.includes('Avg')) {
      const wwIndex = parseInt(header.replace('WW', '')) - 1;
      students[studentIndex].writtenWork[wwIndex] = parseValueOrZero(value);
    } else if (header?.startsWith('PT') && !header.includes('Avg')) {
      const ptIndex = parseInt(header.replace('PT', '')) - 1;
      students[studentIndex].performanceTasks[ptIndex] = parseValueOrZero(value);
    } else if (header?.startsWith('QA') && !header.includes('Avg')) {
      const qaIndex = parseInt(header.replace('QA', '')) - 1;
      students[studentIndex].quarterlyAssessment[qaIndex] = parseValueOrZero(value);
    }
  }

  function recalculateRow(rowIndex) {
    if (rowIndex === 0) return; // Skip header row
    
    const studentIndex = rowIndex - 1;
    const student = students[studentIndex];
    
    // Find column indices for averages
    const headers = spreadsheetData[0];
    const wwAvgIndex = headers.findIndex(h => h === 'WW Avg');
    const ptAvgIndex = headers.findIndex(h => h === 'PT Avg');
    const qaAvgIndex = headers.findIndex(h => h === 'QA Avg');
    const finalGradeIndex = headers.findIndex(h => h === 'Final Grade');
    
    // Update averages
    if (wwAvgIndex !== -1) {
      spreadsheetData[rowIndex][wwAvgIndex] = calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals, 'writtenWork');
    }
    if (ptAvgIndex !== -1) {
      spreadsheetData[rowIndex][ptAvgIndex] = calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals, 'performanceTasks');
    }
    if (qaAvgIndex !== -1) {
      spreadsheetData[rowIndex][qaAvgIndex] = calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals, 'quarterlyAssessment');
    }
    if (finalGradeIndex !== -1) {
      spreadsheetData[rowIndex][finalGradeIndex] = calculateFinalGrade(student);
    }
    
    // Trigger reactivity
    spreadsheetData = [...spreadsheetData];
  }

  function updateSpreadsheetData() {
    if (!selectedCell || selectedCell.row === 0) return;
    
    const { row, col } = selectedCell;
    const studentIndex = row - 1;
    const student = students[studentIndex];
    
    if (!student) return;
    
    // Get the column mapping to determine which assessment type and index
    const columnMapping = getColumnMapping(col);
    if (!columnMapping) return;
    
    const { assessmentType, columnIndex } = columnMapping;
    
    // Parse and validate the input
    let value = editValue.trim();
    let numericValue = null;
    let isValid = true;
    
    if (value !== '') {
      numericValue = parseFloat(value);
      if (isNaN(numericValue) || numericValue < 0) {
        // Invalid input - convert to 0 and mark as invalid
        numericValue = 0;
        isValid = false;
        invalidCells.add(`${row}-${col}`);
        
        // Remove invalid marking after 3 seconds
        setTimeout(() => {
          invalidCells.delete(`${row}-${col}`);
          invalidCells = new Set(invalidCells); // Trigger reactivity
        }, 3000);
      } else {
        // Valid input - remove from invalid cells if it was there
        invalidCells.delete(`${row}-${col}`);
      }
    } else {
      // Empty value is valid (represents no score)
      numericValue = null;
      invalidCells.delete(`${row}-${col}`);
    }
    
    // Update the student's data
    student[assessmentType][columnIndex] = numericValue;
    
    // Trigger reactivity
    students = [...students];
    
    // Reinitialize spreadsheet to recalculate averages and final grades
    initializeSpreadsheetData();
    
    // Check for data changes after update
    checkForDataChanges();
    
    // Trigger debounced auto-save on data change
    triggerDebouncedAutoSave();
  }

  function handleKeyDown(event, rowIndex, colIndex) {
    if (!selectedCell) return;
    
    // ONLY handle navigation when we're actually editing (input is focused)
    if (!isEditing) return;
    
    // Handle navigation for ALL keys, not just when editing
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopPropagation(); // Stop event bubbling
      updateSpreadsheetData(); // Save first
      isEditing = false;
      if (rowIndex > 1) {
        selectedCell = { row: rowIndex - 1, col: colIndex };
      }
      return;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation(); // Stop event bubbling
      updateSpreadsheetData(); // Save first
      isEditing = false;
      if (rowIndex < spreadsheetData.length - 1) {
        selectedCell = { row: rowIndex + 1, col: colIndex };
      }
      return;
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation(); // Stop event bubbling
      updateSpreadsheetData(); // Save first
      isEditing = false;
      if (colIndex > 0) {
        selectedCell = { row: rowIndex, col: colIndex - 1 };
      }
      return;
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation(); // Stop event bubbling
      updateSpreadsheetData(); // Save first
      isEditing = false;
      if (colIndex < spreadsheetData[0].length - 1) {
        selectedCell = { row: rowIndex, col: colIndex + 1 };
      }
      return;
    }
    
    if (event.key === 'Enter') {
      event.preventDefault();
      isEditing = false;
      updateSpreadsheetData();
      
      // Move to next row, same column
      if (rowIndex < spreadsheetData.length - 1) {
        selectedCell = { row: rowIndex + 1, col: colIndex };
        if (!isCalculatedColumn(colIndex) && colIndex > 1) {
          isEditing = true;
          editValue = '';
          justStartedEditing = true;
        }
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      isEditing = false;
      editValue = '';
    } else if (event.key === 'Tab') {
      event.preventDefault();
      isEditing = false;
      updateSpreadsheetData();
      
      // Move to next editable cell
      let nextCol = colIndex + 1;
      while (nextCol < headers.length && isCalculatedColumn(nextCol)) {
        nextCol++;
      }
      
      if (nextCol < headers.length) {
        selectedCell = { row: rowIndex, col: nextCol };
        if (!isCalculatedColumn(nextCol)) {
          isEditing = true;
          editValue = '';
          justStartedEditing = true;
        }
      } else if (rowIndex < spreadsheetData.length - 1) {
        // Move to first editable column of next row
        selectedCell = { row: rowIndex + 1, col: 2 };
        isEditing = true;
        editValue = '';
        justStartedEditing = true;
      }
    }
  }

  onMount(() => {
    initializeSpreadsheetData();
  });

  // Auto-save function (silent save without UI feedback)
  async function autoSave() {
    if (isSaving || !students.length || !sectionId || !subjectId) {
      return;
    }

    try {
      // Prepare grades data for API
      const gradesData = students.map(student => ({
        student_id: student.accountNumber || student.account_number || student.id,
        writtenWork: student.writtenWork,
        performanceTasks: student.performanceTasks,
        quarterlyAssessment: student.quarterlyAssessment
      }));

      await authenticatedFetch('/api/grades/save', {
        method: 'POST',
        body: JSON.stringify({
          section_id: sectionId,
          subject_id: subjectId,
          grading_period_id: gradingPeriodId,
          grading_config: gradingConfig,
          grades: gradesData
        })
      });

      // Update save state after successful auto-save
      originalData = createDataSnapshot();
      hasUnsavedChanges = false;
      isDataSaved = true;

    } catch (error) {
      // Silent auto-save errors - only log critical failures
      console.error('Auto-save failed:', error.message);
    }
  }

  // Debounced auto-save function (triggers auto-save after 3 seconds of inactivity)
  function triggerDebouncedAutoSave() {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set new timeout for 3 seconds
    autoSaveTimeout = setTimeout(() => {
      autoSave();
    }, 3000);
  }

  // Manual save function (with UI feedback)
  async function saveGrades() {
    if (!sectionId || !subjectId) {
      toastStore.error('Missing section or subject information');
      return;
    }

    isSaving = true;
    saveMessage = '';
    saveSuccess = false;

    try {
      // Prepare grades data for API
      const gradesData = students.map(student => ({
        student_id: student.accountNumber || student.account_number || student.id,
        writtenWork: student.writtenWork,
        performanceTasks: student.performanceTasks,
        quarterlyAssessment: student.quarterlyAssessment
      }));

      const result = await authenticatedFetch('/api/grades/save', {
        method: 'POST',
        body: JSON.stringify({
          section_id: sectionId,
          subject_id: subjectId,
          grading_period_id: gradingPeriodId,
          grading_config: gradingConfig,
          grades: gradesData
        })
      });

      saveSuccess = true;
      toastStore.success('All grades have been saved to the database');

      // Update save state after successful save
      originalData = createDataSnapshot();
      hasUnsavedChanges = false;
      isDataSaved = true;

      // Clear the message after 3 seconds
      setTimeout(() => {
        saveMessage = '';
      }, 3000);

    } catch (error) {
      console.error('Error saving grades:', error);
      saveSuccess = false;
      saveMessage = error.message || 'Failed to save grades';
      toastStore.error(saveMessage);

      // Clear the message after 5 seconds for errors
      setTimeout(() => {
        saveMessage = '';
      }, 5000);
    } finally {
      isSaving = false;
    }
  }

  // Effect to reinitialize when students or gradingConfig changes
  $effect(() => {
    // Only track the specific dependencies we care about
    const studentCount = students.length;
    const config = gradingConfig;
    
    // Use untrack to prevent the effect from tracking changes to spreadsheetData
    untrack(() => {
      if (studentCount > 0 || config) {
        initializeSpreadsheetData();
      }
    });
  });

  // Effect to set up auto-save when component mounts
  $effect(() => {
    // Set up auto-save interval (every 30 seconds)
    autoSaveInterval = setInterval(autoSave, 30000);
    
    // Cleanup function
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  });
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<div class="grading-spreadsheet" bind:this={spreadsheetContainer}>
  <!-- Save Button Section -->
  <div class="save-section">
    <button 
      class="save-button" 
      class:saved={isDataSaved && !hasUnsavedChanges}
      onclick={saveGrades}
      disabled={isSaving || (isDataSaved && !hasUnsavedChanges)}
      title={isDataSaved && !hasUnsavedChanges ? "All grades are saved" : "Save all grades to database"}
    >
      {#if isSaving}
        <span class="material-symbols-outlined spinning">sync</span>
        <span>Saving...</span>
      {:else if isDataSaved && !hasUnsavedChanges}
        <span class="material-symbols-outlined">check_circle</span>
        <span>Grades Saved</span>
      {:else}
        <span class="material-symbols-outlined">save</span>
        <span>Save Grades</span>
      {/if}
    </button>
  </div>
  <div class="spreadsheet-container">
    <table class="spreadsheet-table">
      <thead>
        <tr>
          {#each spreadsheetData[0] || [] as header, colIndex}
            <th class="spreadsheet-header" 
                class:student-info={colIndex < 2} 
                class:calculated={isCalculatedColumn(colIndex)}
                class:clickable={isAssessmentColumn(colIndex)}
                onclick={(e) => handleHeaderClick(colIndex, e)}
                title={isAssessmentColumn(colIndex) ? 'Click to set total scores' : ''}>
              <span class="header-text">{header}</span>
              {#if isAssessmentColumn(colIndex)}
                <div class="header-overlay">
                  <span class="header-icon material-symbols-outlined">settings</span>
                </div>
              {/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each spreadsheetData.slice(1) as row, rowIndex}
          <tr class="spreadsheet-row">
            {#each row as cell, colIndex}
              <td 
                class="spreadsheet-cell"
                class:selected={selectedCell?.row === rowIndex + 1 && selectedCell?.col === colIndex}
                class:editing={isEditing && selectedCell?.row === rowIndex + 1 && selectedCell?.col === colIndex}
                class:student-info={colIndex < 2}
                class:calculated={isCalculatedColumn(colIndex)}
                class:editable={!isCalculatedColumn(colIndex) && colIndex > 1}
                class:invalid={invalidCells.has(`${rowIndex + 1}-${colIndex}`)}
                onclick={(e) => handleCellClick(rowIndex + 1, colIndex, e)}
              >
                {#if isEditing && selectedCell?.row === rowIndex + 1 && selectedCell?.col === colIndex}
                  <input
                    type="text"
                    class="cell-input"
                    bind:value={editValue}
                    onkeydown={(e) => handleKeyDown(e, rowIndex + 1, colIndex)}
                    onblur={() => {isEditing = false; updateSpreadsheetData();}}
                    autofocus
                  />
                {:else}
                  <span class="cell-content">{cell}</span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .save-section {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background-color: var(--md-sys-color-surface-container-low);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }

  .save-button {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border: none;
    border-radius: var(--radius-md);
    font-weight: var(--md-sys-typescale-label-large-weight);
    cursor: pointer;
    transition: all var(--transition-normal);
    min-height: 40px;
  }

  .save-button:hover:not(:disabled) {
    background-color: var(--md-sys-color-primary-hover);
    box-shadow: var(--elevation-1);
  }

  .save-button:disabled {
    background-color: var(--md-sys-color-surface-variant);
    color: var(--md-sys-color-on-surface-variant);
    cursor: not-allowed;
  }

  .save-button.saved {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    cursor: default;
  }

  .save-button.saved:hover {
    background-color: var(--md-sys-color-tertiary-container);
    box-shadow: none;
  }
  .save-message {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    font-size: var(--md-sys-typescale-body-small-size);
    font-weight: var(--md-sys-typescale-label-medium-weight);
  }

  .save-message.success {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }

  .save-message.error {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }

  .spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .grading-spreadsheet {
    background-color: var(--md-sys-color-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
    overflow: hidden;
    
  }

  .spreadsheet-container {
    overflow: auto;
    max-height: 70vh;
  }

  .spreadsheet-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--md-sys-typescale-body-small-size);
    background-color: var(--md-sys-color-surface);
    min-width: 1200px;
  }

  .spreadsheet-header {
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface);
    font-weight: var(--md-sys-typescale-label-large-weight);
    padding: var(--spacing-md);
    border: 1px solid var(--md-sys-color-outline-variant);
    position: sticky;
    top: 0;
    z-index: 10;
    text-align: center;
    min-width: 80px;
    position: relative;
  }

  .header-text {
    display: block;
  }

  .header-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .spreadsheet-header.clickable:hover .header-overlay {
    opacity: 1;
  }

  .spreadsheet-header.student-info {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    position: sticky;
    left: 0;
    z-index: 11;
    min-width: 120px;
  }

  .spreadsheet-header.calculated {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    font-weight: 600;
  }

  .spreadsheet-header.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  }

  .header-icon {
    font-size: 18px;
    color: white;
  }

  .spreadsheet-cell.calculated {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    font-weight: 600;
  }

  .spreadsheet-row {
    transition: background-color var(--transition-normal);
  }

  .spreadsheet-row:hover {
    background-color: var(--md-sys-color-surface-container-hover);
  }



  .spreadsheet-cell {
    border: 1px solid var(--md-sys-color-outline-variant);
    padding: 0;
    text-align: center;
    vertical-align: middle;
    position: relative;
    min-width: 80px;
    height: 40px;
  }

  .spreadsheet-cell.student-info {
    background-color: var(--md-sys-color-surface-container-low);
    position: sticky;
    left: 0;
    z-index: 5;
    text-align: left;
    min-width: 120px;
  }

  .spreadsheet-cell.calculated {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    font-weight: 600;
  }

  .spreadsheet-cell.editable {
    cursor: pointer;
  }


  .spreadsheet-cell.selected {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
    z-index: 6;
  }

  .spreadsheet-cell.editing {
    background-color: var(--md-sys-color-surface);
  }

  .cell-content {
    display: block;
    width: 100%;
    height: 100%;
    padding: var(--spacing-sm);
    box-sizing: border-box;
  }

  .cell-input {
    width: 100%;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    text-align: center;
    font-size: inherit;
    color: var(--md-sys-color-on-surface);
    padding: var(--spacing-sm);
    box-sizing: border-box;
    min-width: 80px;
    max-width: 80px;
  }

  .spreadsheet-cell.student-info .cell-input {
    text-align: left;
  }

  /* Scrollbar Styling */
  .spreadsheet-container::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .spreadsheet-container::-webkit-scrollbar-track {
    background: var(--md-sys-color-surface-variant);
  }

  .spreadsheet-container::-webkit-scrollbar-thumb {
    background: var(--md-sys-color-outline-variant);
    border-radius: var(--radius-sm);
  }

  .spreadsheet-container::-webkit-scrollbar-thumb:hover {
    background: var(--md-sys-color-outline);
  }

  /* Invalid cell styling */
  .spreadsheet-cell.invalid {
    background-color: var(--md-sys-color-error-container) !important;
    color: var(--md-sys-color-on-error-container) !important;
    animation: errorPulse 0.5s ease-in-out;
  }

  .spreadsheet-cell.invalid .cell-content {
    color: var(--md-sys-color-on-error-container);
    font-weight: 600;
  }

  @keyframes errorPulse {
    0% { 
      background-color: var(--md-sys-color-error);
      transform: scale(1);
    }
    50% { 
      background-color: var(--md-sys-color-error);
      transform: scale(1.02);
    }
    100% { 
      background-color: var(--md-sys-color-error-container);
      transform: scale(1);
    }
  }
</style>

<!-- Custom Total Score Modal -->
<CustomTotalScoreModal
  bind:visible={modalVisible}
  assessmentType={modalAssessmentType}
  columnIndex={modalColumnIndex}
  columnName={modalColumnName}
  currentTotal={modalCurrentTotal}
  canRemove={modalAssessmentType ? canRemoveColumn(modalAssessmentType) : false}
  existingColumnNames={modalAssessmentType ? getExistingColumnNames(modalAssessmentType) : []}
  onSave={updateTotalScores}
  onRename={handleColumnRename}
  onRemove={handleColumnRemove}
  onClose={closeModal}
/>
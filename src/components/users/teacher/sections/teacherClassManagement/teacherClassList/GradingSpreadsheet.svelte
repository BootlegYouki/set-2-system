<script>
  import { onMount } from 'svelte';
  import * as XLSX from 'xlsx';
  import { toastStore } from '../../../../../common/js/toastStore.js';
  import CustomTotalScoreModal from './CustomTotalScoreModal.svelte';

  export let students = [];
  export let gradingConfig = {
    writtenWork: { 
      count: 3,
      totals: [] // Array to store individual column totals
    },
    performanceTasks: { 
      count: 3,
      totals: [] // Array to store individual column totals
    },
    quarterlyAssessment: { 
      count: 1,
      totals: [] // Array to store individual column totals
    }
  };

  let spreadsheetContainer;
  let selectedCell = null;
  let isEditing = false;
  let editValue = '';
  let justStartedEditing = false;
  let copiedData = null;
  let invalidCells = new Set(); // Track cells with invalid input that were converted to 0

  // Initialize spreadsheet data
  let spreadsheetData = [];
  let headers = [];

  // Initialize spreadsheet data
  function initializeSpreadsheetData() {
    const headers = ['Student ID', 'Student Name'];
    
    // Add Written Work columns
    for (let i = 1; i <= gradingConfig.writtenWork.count; i++) {
      headers.push(`WW${i}`);
    }
    headers.push('WW Avg');
    
    // Add Performance Tasks columns
    for (let i = 1; i <= gradingConfig.performanceTasks.count; i++) {
      headers.push(`PT${i}`);
    }
    headers.push('PT Avg');
    
    // Add Quarterly Assessment columns
    for (let i = 1; i <= gradingConfig.quarterlyAssessment.count; i++) {
      headers.push(`QA${i}`);
    }
    headers.push('QA Avg');
    headers.push('Final Grade');

    spreadsheetData = [headers];

    // Add student data rows
    students.forEach(student => {
      const row = [student.id, student.name];
      
      // Written Work scores
      for (let i = 0; i < gradingConfig.writtenWork.count; i++) {
        row.push(student.writtenWork[i] || '');
      }
      row.push(calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals, 'writtenWork'));
      
      // Performance Tasks scores
      for (let i = 0; i < gradingConfig.performanceTasks.count; i++) {
        row.push(student.performanceTasks[i] || '');
      }
      row.push(calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals, 'performanceTasks'));
      
      // Quarterly Assessment scores
      for (let i = 0; i < gradingConfig.quarterlyAssessment.count; i++) {
        row.push(student.quarterlyAssessment[i] || '');
      }
      row.push(calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals, 'quarterlyAssessment'));
      
      // Final Grade
      row.push(calculateFinalGrade(student));
      
      spreadsheetData.push(row);
    });
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
      return Math.round((sum / validScores.length) * 100) / 100;
    } else {
      // Original calculation for backward compatibility
      sum = validScores.reduce((acc, score) => acc + parseFloat(score), 0);
      return Math.round((sum / validScores.length) * 100) / 100;
    }
  }

  function calculateFinalGrade(student) {
    const wwAvg = calculateAverage(student.writtenWork, gradingConfig.writtenWork.totals, 'writtenWork');
    const ptAvg = calculateAverage(student.performanceTasks, gradingConfig.performanceTasks.totals, 'performanceTasks');
    const qaAvg = calculateAverage(student.quarterlyAssessment, gradingConfig.quarterlyAssessment.totals, 'quarterlyAssessment');
    
    if (wwAvg === '' || ptAvg === '' || qaAvg === '') return '';
    
    const finalGrade = (wwAvg * gradingConfig.writtenWork.weight) + 
                      (ptAvg * gradingConfig.performanceTasks.weight) + 
                      (qaAvg * gradingConfig.quarterlyAssessment.weight);
    
    return Math.round(finalGrade * 100) / 100;
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
          editValue = '';
          justStartedEditing = true;
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
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    return (header?.startsWith('WW') || header?.startsWith('PT') || header?.startsWith('QA')) && !header.includes('Avg');
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
    
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    
    // Only handle assessment columns (not averages or final grade)
    if (header?.startsWith('WW') && !header.includes('Avg')) {
      const columnIndex = parseInt(header.replace('WW', '')) - 1; // Convert WW1 to index 0
      openTotalScoreModal('writtenWork', columnIndex, header);
    } else if (header?.startsWith('PT') && !header.includes('Avg')) {
      const columnIndex = parseInt(header.replace('PT', '')) - 1; // Convert PT1 to index 0
      openTotalScoreModal('performanceTasks', columnIndex, header);
    } else if (header?.startsWith('QA') && !header.includes('Avg')) {
      const columnIndex = parseInt(header.replace('QA', '')) - 1; // Convert QA1 to index 0
      openTotalScoreModal('quarterlyAssessment', columnIndex, header);
    }
  }

  // State for custom modal
  let modalVisible = false;
  let modalAssessmentType = '';
  let modalColumnIndex = 0;
  let modalColumnName = '';
  let modalCurrentTotal = '';

  // Open total score modal
  function openTotalScoreModal(assessmentType, columnIndex, columnName) {
    modalAssessmentType = assessmentType;
    modalColumnIndex = columnIndex;
    modalColumnName = columnName;
    modalCurrentTotal = getTotalForColumn(assessmentType, columnIndex);
    modalVisible = true;
  }

  // Update total scores and recalculate
  function updateTotalScores(assessmentType, columnIndex, newTotal) {
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

  // Helper function to get current total for a specific column
  function getTotalForColumn(assessmentType, columnIndex) {
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
        assessmentType = 'writtenWork';
        assessmentIndex = parseInt(header.substring(2)) - 1;
      } else if (header.startsWith('PT')) {
        assessmentType = 'performanceTasks';
        assessmentIndex = parseInt(header.substring(2)) - 1;
      } else if (header.startsWith('QA')) {
        assessmentType = 'quarterlyAssessment';
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
    if (!selectedCell || !editValue) return;
    
    const rowIndex = selectedCell.row;
    const colIndex = selectedCell.col;
    let value = editValue;
    let wasInvalid = false;
    
    // Validate and convert invalid input to 0 for grade columns
    const headers = spreadsheetData[0];
    const header = headers[colIndex];
    if (header?.startsWith('WW') || header?.startsWith('PT') || header?.startsWith('QA')) {
      if (!header.includes('Avg')) { // Only for input columns, not calculated averages
        if (value && value.trim() !== '') {
          const parsed = parseFloat(value);
          
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
          
          // Validate input: leave blank if invalid, negative, or exceeds maximum
          if (isNaN(parsed) || parsed < 0 || (maxScore && parsed > maxScore)) {
            value = '';
            editValue = ''; // Update the input field as well
            wasInvalid = true;
            
            // Show appropriate toast message based on the type of invalid input
            if (isNaN(parsed)) {
              toastStore.error('Invalid input detected. Only numbers are allowed in grade cells.');
            } else if (parsed < 0) {
              toastStore.error('Negative values are not allowed. Score has been cleared.');
            } else if (maxScore && parsed > maxScore) {
              toastStore.error(`Score cannot exceed the maximum of ${maxScore}. Value has been cleared.`);
            }
          }
        }
      }
    }
    
    // Track invalid cells for styling
    const cellKey = `${rowIndex}-${colIndex}`;
    if (wasInvalid) {
      invalidCells.add(cellKey);
    } else {
      invalidCells.delete(cellKey);
    }
    invalidCells = new Set(invalidCells); // Trigger reactivity
    
    // Update the spreadsheet data
    spreadsheetData[rowIndex][colIndex] = value;
    
    // Update the original student data
    updateStudentData(rowIndex, colIndex, value);
    
    // Recalculate averages and final grades
    recalculateRow(rowIndex);
    
    // Clear the edit value after saving
    editValue = '';
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

  // Reactive statement to reinitialize when data changes
  $: if (students.length > 0 || gradingConfig) {
    initializeSpreadsheetData();
  }
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<div class="grading-spreadsheet" bind:this={spreadsheetContainer}>
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
              {header}
              {#if isAssessmentColumn(colIndex)}
                <span class="header-icon material-symbols-outlined">settings</span>
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
  .grading-spreadsheet {
    background-color: var(--md-sys-color-surface);
    border-radius: var(--radius-lg);
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
    font-size: 16px;
    margin-left: 4px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
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
  onSave={updateTotalScores}
  onClose={closeModal}
/>
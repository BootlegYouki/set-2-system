<script>
  import './todolist.css';

  // Sample todo data - in real app this would come from props or API
  let todos = [
    {
      id: 1,
      title: 'Complete Physics Lab Report',
      description: 'Finish the lab report on gravity experiments',
      dueDate: 'Tomorrow',
      completed: false,
      category: 'assignment'
    },
    {
      id: 2,
      title: 'Study for Math Quiz',
      description: 'Review chapters 5-7 for tomorrow\'s quiz',
      dueDate: 'Today',
      completed: false,
      category: 'study'
    },
    {
      id: 3,
      title: 'Submit College Application',
      description: 'Complete and submit application for University',
      dueDate: 'Next Week',
      completed: true,
      category: 'personal'
    },
    {
      id: 4,
      title: 'Buy groceries',
      description: 'Buy milk, bread, and eggs',
      dueDate: 'Next Week',
      completed: false,
      category: 'personal'
    },
    {
      id: 5,
      title: 'Read a book',
      description: 'Read a book on Svelte',
      dueDate: 'Next Week',
      completed: false,
      category: 'personal'
    }
  ];

  let newTodoTitle = '';
  let newTodoDescription = '';
  let newTodoCategory = 'personal';
  let newTodoDueDate = '';
  let isAddTodoFormOpen = false;

  // Category options
  const categoryOptions = [
    { value: 'assignment', label: 'Assignment', icon: 'assignment' },
    { value: 'study', label: 'Study', icon: 'book' },
    { value: 'personal', label: 'Personal', icon: 'person' },
    { value: 'project', label: 'Project', icon: 'folder' },
    { value: 'exam', label: 'Exam', icon: 'quiz' }
  ];



  // Dropdown state
  let isCategoryDropdownOpen = false;
  let isDatePickerOpen = false;

  // Date picker variables
  const today = new Date();
  let selectedYear = today.getFullYear();
  let selectedMonth = today.getMonth();
  let selectedDay = null;

  // Date constants
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Functions
  function addTodo() {
    if (newTodoTitle.trim()) {
      const newTodo = {
        id: Date.now(),
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim(),
        dueDate: newTodoDueDate || 'No due date',
        completed: false,
        category: newTodoCategory
      };
      todos = [newTodo, ...todos];
      newTodoTitle = '';
      newTodoDescription = '';
      newTodoCategory = 'personal';
      newTodoDueDate = '';
      isAddTodoFormOpen = false;
    }
  }

  function toggleAddTodoForm() {
    isAddTodoFormOpen = !isAddTodoFormOpen;
    if (!isAddTodoFormOpen) {
      // Reset form when closing
      newTodoTitle = '';
      newTodoDescription = '';
      newTodoCategory = 'personal';
      newTodoDueDate = '';
      isCategoryDropdownOpen = false;
      isDatePickerOpen = false;
    }
  }

  // Dropdown functions
  function toggleCategoryDropdown() {
    isCategoryDropdownOpen = !isCategoryDropdownOpen;
  }

  function selectCategory(category) {
    newTodoCategory = category;
    isCategoryDropdownOpen = false;
  }



  function handleClickOutside(event) {
    if (!event.target.closest('.custom-dropdown')) {
      isCategoryDropdownOpen = false;
    }
    if (!event.target.closest('.custom-date-picker')) {
      isDatePickerOpen = false;
    }
  }

  // Bind click outside handler to document
  import { onMount } from 'svelte';
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Get category label by value
  function getCategoryLabel(value) {
    const category = categoryOptions.find(cat => cat.value === value);
    return category ? category.label : 'Select Category';
  }

  // Get category icon by value
  function getCategoryIcon(value) {
    const category = categoryOptions.find(cat => cat.value === value);
    return category ? category.icon : 'category';
  }



  // Date picker functions
  function toggleDatePicker() {
    isDatePickerOpen = !isDatePickerOpen;
    if (isDatePickerOpen) {
      if (newTodoDueDate) {
        // Parse existing date
        const date = new Date(newTodoDueDate + 'T00:00:00');
        selectedYear = date.getFullYear();
        selectedMonth = date.getMonth();
        selectedDay = date.getDate();
      } else {
        // Reset to current date
        const today = new Date();
        selectedYear = today.getFullYear();
        selectedMonth = today.getMonth();
        selectedDay = null;
      }
    }
  }

  function selectDate(day) {
    selectedDay = day;
    // Create date in local timezone to avoid timezone issues
    const year = selectedYear;
    const month = selectedMonth + 1; // Month is 0-indexed, but we need 1-indexed for ISO string
    const dayStr = day.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    newTodoDueDate = `${year}-${monthStr}-${dayStr}`;
    isDatePickerOpen = false;
  }

  function clearDate() {
    newTodoDueDate = '';
    selectedDay = null;
    isDatePickerOpen = false;
  }

  function previousMonth() {
    if (selectedMonth === 0) {
      selectedMonth = 11;
      selectedYear--;
    } else {
      selectedMonth--;
    }
  }

  function nextMonth() {
    if (selectedMonth === 11) {
      selectedMonth = 0;
      selectedYear++;
    } else {
      selectedMonth++;
    }
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  // Reactive statement for formatted date
  $: formattedSelectedDate = (() => {
    if (!newTodoDueDate) return 'Select due date';
    // Parse date in local timezone to avoid timezone issues
    const date = new Date(newTodoDueDate + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  })();

  function isToday(day) {
    const today = new Date();
    return day === today.getDate() && 
           selectedMonth === today.getMonth() && 
           selectedYear === today.getFullYear();
  }

  function isSelected(day) {
    if (!newTodoDueDate) return false;
    // Parse date in local timezone
    const date = new Date(newTodoDueDate + 'T00:00:00');
    return day === date.getDate() && 
           selectedMonth === date.getMonth() && 
           selectedYear === date.getFullYear();
  }

  function toggleTodo(id) {
    todos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }

  // Helper function to format due date
  function formatDueDate(dateString) {
    if (!dateString || dateString === 'No due date') return 'No due date';
    
    // If it's already a formatted string (like 'Today', 'Tomorrow', 'Next Week'), return as is
    if (dateString === 'Today' || dateString === 'Tomorrow' || dateString === 'Next Week') {
      return dateString;
    }
    
    // Try to parse as a date
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if it's not a valid date
    }
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Reset time for comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  $: completedCount = todos.filter(t => t.completed).length;
  $: totalCount = todos.length;
</script>

<div class="todo-container">
  <!-- Header Section -->
  <div class="todo-header">
    <div class="header-content">
      <h1 class="page-title">Todo List</h1>
      <p class="page-subtitle">
        Keep track of your tasks and assignments
        <span class="progress-badge">{completedCount}/{totalCount} completed</span>
      </p>
    </div>
  </div>

  <!-- Add Todo Button -->
  <div class="add-todo-button-section">
    <button class="add-todo-toggle-btn" on:click={toggleAddTodoForm}>
      <span class="material-symbols-outlined">{isAddTodoFormOpen ? 'remove' : 'add'}</span>
      {isAddTodoFormOpen ? 'Cancel' : 'Add New Task'}
    </button>
  </div>

  <!-- Add Todo Form (Collapsible) -->
  {#if isAddTodoFormOpen}
    <div class="add-todo-section">
      <h2 class="section-title">Add New Task</h2>
      <div class="add-todo-form">
      <input
        type="text"
        bind:value={newTodoTitle}
        placeholder="Enter task title..."
        class="todo-input"
        on:keydown={(e) => e.key === 'Enter' && addTodo()}
      />
      <textarea
        bind:value={newTodoDescription}
        placeholder="Enter description (optional)..."
        class="todo-input todo-textarea"
        rows="3"
      ></textarea>
      
      <div class="form-row">
        <div class="form-field">
          <label class="form-label" for="category-dropdown">Category</label>
          <div class="custom-dropdown">
            <button class="dropdown-toggle" id="category-dropdown" on:click={toggleCategoryDropdown} type="button">
              <div class="dropdown-toggle-content">
                <span class="material-symbols-outlined dropdown-icon-left">{getCategoryIcon(newTodoCategory)}</span>
                <span class="dropdown-label">{getCategoryLabel(newTodoCategory)}</span>
              </div>
              <span class="material-symbols-outlined dropdown-icon {isCategoryDropdownOpen ? 'open' : ''}">
                expand_more
              </span>
            </button>
            
            {#if isCategoryDropdownOpen}
              <div class="dropdown-menu-category">
                {#each categoryOptions as option}
                  <button 
                    class="dropdown-item {option.value === newTodoCategory ? 'selected' : ''}"
                    on:click={() => selectCategory(option.value)}
                    type="button"
                  >
                    <span class="material-symbols-outlined">{option.icon}</span>
                    <span>{option.label}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="form-field">
          <label class="form-label" for="due-date-picker">Due Date (optional)</label>
            <div class="custom-date-picker">
              <div class="date-picker-toggle-wrapper">
                <button class="date-picker-toggle" id="due-date-picker" on:click={toggleDatePicker} type="button">
                  <div class="date-picker-toggle-content">
                    <span class="material-symbols-outlined date-picker-icon-left">calendar_today</span>
                    <span class="date-picker-label">{formattedSelectedDate}</span>
                  </div>
                  <div class="date-picker-actions">
                    {#if newTodoDueDate}
                      <!-- svelte-ignore node_invalid_placement_ssr -->
                      <button class="clear-date-btn" on:click|stopPropagation={clearDate} type="button" title="Clear date">
                        <span class="material-symbols-outlined">close</span>
                      </button>
                    {/if}
                    <span class="material-symbols-outlined dropdown-icon {isDatePickerOpen ? 'open' : ''}">
                      expand_more
                    </span>
                  </div>
                </button>
              </div>
              
              {#if isDatePickerOpen}
                <div class="date-picker-dropdown">
                  <div class="date-picker-header">
                    <button class="nav-btn" on:click={previousMonth} type="button">
                      <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div class="month-year-display">
                      <span class="month-name">{monthNames[selectedMonth]}</span>
                      <span class="year-name">{selectedYear}</span>
                    </div>
                    <button class="nav-btn" on:click={nextMonth} type="button">
                      <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                  
                  <div class="calendar-grid">
                    <!-- Day headers -->
                    {#each dayNames as dayName}
                      <div class="day-header">{dayName}</div>
                    {/each}
                    
                    <!-- Empty cells for days before month starts -->
                    {#each Array(getFirstDayOfMonth(selectedYear, selectedMonth)) as _}
                      <div class="empty-day"></div>
                    {/each}
                    
                    <!-- Days of the month -->
                    {#each Array(getDaysInMonth(selectedYear, selectedMonth)) as _, i}
                      {@const day = i + 1}
                      <button 
                        class="day-cell {isToday(day) ? 'today' : ''} {isSelected(day) ? 'selected' : ''}"
                        on:click={() => selectDate(day)}
                        type="button"
                      >
                        {day}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
        </div>
      </div>

        <button class="add-todo-btn" on:click={addTodo} disabled={!newTodoTitle.trim()}>
          <span class="material-symbols-outlined">add</span>
          Add Task
        </button>
      </div>
    </div>
  {/if}

  <!-- Todo List -->
  <div class="todos-section">
    {#if todos.length > 0}
      <div class="todos-list">
        {#each todos as todo, index (todo.id)}
          <div class="todo-card" class:completed={todo.completed} style="--card-index: {index + 1};">
            <div class="todo-checkbox">
              <input
                type="checkbox"
                checked={todo.completed}
                on:change={() => toggleTodo(todo.id)}
                id="todo-{todo.id}"
              />
              <label for="todo-{todo.id}" class="checkbox-label"></label>
            </div>

            <div class="todo-content">
              <h3 class="todo-title" class:completed={todo.completed}>{todo.title}</h3>
              {#if todo.description}
                <p class="todo-description">{todo.description}</p>
              {/if}
              <div class="todo-meta">
                <span class="todo-category">{todo.category}</span>
                <span class="todo-due-date">{formatDueDate(todo.dueDate)}</span>
              </div>
            </div>

            <div class="todo-actions">
              <button
                class="action-btn delete-btn"
                on:click={() => deleteTodo(todo.id)}
                title="Delete task"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-todos">
        <div class="no-todos-icon">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h3>No Tasks</h3>
        <p>You don't have any tasks yet. Add one above to get started!</p>
      </div>
    {/if}
  </div>
</div>

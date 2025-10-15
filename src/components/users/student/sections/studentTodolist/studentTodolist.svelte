<script>
  import './studentTodolist.css';
  import { authStore } from '../../../../login/js/auth.js';
  import { api } from '../../../../../routes/api/helper/api-helper.js';
  import { modalStore } from '../../../../common/js/modalStore.js';
  import { toastStore } from '../../../../common/js/toastStore.js';
  import { onMount } from 'svelte';

  // Todo data from database
  let todos = [];
  let buttonLoading = false;
  let loading = false;
  let error = null;

  // Search and filter state
  let searchQuery = '';
  let selectedFilter = 'all';
  let selectedStatusFilter = 'all';
  let isFilterDropdownOpen = false;
  let isStatusFilterDropdownOpen = false;

  let newTodoTitle = '';
  let newTodoDescription = '';
  let newTodoCategory = 'personal';
  let newTodoDueDate = '';
  let isAddTodoFormOpen = false;

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Categories', icon: 'category' },
    { value: 'assignment', label: 'Assignment', icon: 'assignment' },
    { value: 'study', label: 'Study', icon: 'book' },
    { value: 'personal', label: 'Personal', icon: 'person' },
    { value: 'project', label: 'Project', icon: 'folder' },
    { value: 'exam', label: 'Exam', icon: 'quiz' }
  ];

  const statusFilterOptions = [
    { value: 'all', label: 'All Status', icon: 'list' },
    { value: 'pending', label: 'Pending', icon: 'pending' },
    { value: 'completed', label: 'Completed', icon: 'check_circle' }
  ];

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

  // API Functions
  async function fetchTodos() {
    try {
      loading = true;
      error = null;
      
      const user = $authStore.userData;
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.get(`/api/student-todos?studentId=${user.id}`);
      
      if (response.success) {
        todos = response.data || [];
      } else {
        throw new Error(response.error || 'Failed to fetch todos');
      }
    } catch (err) {
      console.error('Error fetching todos:', err);
      error = err.message;
      toastStore.error('Failed to load todos: ' + err.message);
    } finally {
      loading = false;
    }
  }

  async function addTodo() {
    try {
      buttonLoading = true;
      
      const user = $authStore.userData;
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      if (!newTodoTitle.trim()) {
        toastStore.error('Please enter a title for your todo');
        return;
      }

      const todoData = {
        studentId: user.id,
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim() || null,
        category: newTodoCategory,
        dueDate: newTodoDueDate || null
      };

      const response = await api.post('/api/student-todos', todoData);
      
      if (response.success) {
        todos = [response.data, ...todos]; // Add to beginning of array
        toastStore.success('Todo added successfully!');
        
        // Reset form
        newTodoTitle = '';
        newTodoDescription = '';
        newTodoCategory = 'personal';
        newTodoDueDate = '';
        isAddTodoFormOpen = false;
      } else {
        throw new Error(response.error || 'Failed to add todo');
      }
    } catch (err) {
      console.error('Error adding todo:', err);
      toastStore.error('Failed to add todo: ' + err.message);
    } finally {
      buttonLoading = false;
    }
  }

  async function deleteTodo(todoId) {
    try {
      const user = $authStore.userData;
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.delete('/api/student-todos', {
        id: todoId,
        studentId: user.id
      });
      
      if (response.success) {
        todos = todos.filter(todo => todo.id !== todoId);
        toastStore.success('Todo deleted successfully!');
      } else {
        throw new Error(response.error || 'Failed to delete todo');
      }
    } catch (err) {
      console.error('Error deleting todo:', err);
      toastStore.error('Failed to delete todo: ' + err.message);
    }
  }

  async function toggleTodo(todoId) {
    try {
      const user = $authStore.userData;
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.put('/api/student-todos', {
        id: todoId,
        studentId: user.id,
        action: 'toggle'
      });
      
      if (response.success) {
        // Update the todo in the local array
        todos = todos.map(todo => 
          todo.id === todoId ? response.data : todo
        );
        
        const todo = response.data;
        const message = todo.completed ? 'Todo marked as completed!' : 'Todo marked as pending!';
        toastStore.success(message);
      } else {
        throw new Error(response.error || 'Failed to update todo');
      }
    } catch (err) {
      console.error('Error toggling todo:', err);
      toastStore.error('Failed to update todo: ' + err.message);
    }
  }

  async function updateTodo(todoId, updateData) {
    try {
      const user = $authStore.userData;
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }

      const response = await api.put('/api/student-todos', {
        id: todoId,
        studentId: user.id,
        action: 'update',
        ...updateData
      });
      
      if (response.success) {
        // Update the todo in the local array
        todos = todos.map(todo => 
          todo.id === todoId ? response.data : todo
        );
        toastStore.success('Todo updated successfully!');
      } else {
        throw new Error(response.error || 'Failed to update todo');
      }
    } catch (err) {
      console.error('Error updating todo:', err);
      toastStore.error('Failed to update todo: ' + err.message);
    }
  }

  // Load todos when component mounts
  onMount(() => {
    fetchTodos();
  });

  // Functions


  // Handle todo deletion with confirmation
  function handleDeleteTodo(todo) {
    modalStore.confirm(
      'Delete Task',
      `Are you sure you want to delete "${todo.title}"? This action cannot be undone.`,
      async () => {
        await deleteTodo(todo.id);
      },
      () => {
        // User cancelled - do nothing
      }
    );
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

  // Filter and search functions
  function toggleFilterDropdown() {
    isFilterDropdownOpen = !isFilterDropdownOpen;
  }

  function toggleStatusFilterDropdown() {
    isStatusFilterDropdownOpen = !isStatusFilterDropdownOpen;
  }

  function selectFilter(filter) {
    selectedFilter = filter;
    isFilterDropdownOpen = false;
  }

  function selectStatusFilter(filter) {
    selectedStatusFilter = filter;
    isStatusFilterDropdownOpen = false;
  }

  function getFilterLabel(value) {
    const filter = filterOptions.find(f => f.value === value);
    return filter ? filter.label : 'All Categories';
  }

  function getFilterIcon(value) {
    const filter = filterOptions.find(f => f.value === value);
    return filter ? filter.icon : 'category';
  }

  function getStatusFilterLabel(value) {
    const filter = statusFilterOptions.find(f => f.value === value);
    return filter ? filter.label : 'All Status';
  }

  function getStatusFilterIcon(value) {
    const filter = statusFilterOptions.find(f => f.value === value);
    return filter ? filter.icon : 'list';
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
    if (!event.target.closest('.filter-dropdown')) {
      isFilterDropdownOpen = false;
      isStatusFilterDropdownOpen = false;
    }
  }
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    
    // Load todos when component mounts
    if ($authStore.userData?.id) {
      fetchTodos();
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  // Reactive statements for filtering
  $: filteredTodos = (() => {
    let filtered = todos;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(query) || 
        (todo.description && todo.description.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(todo => todo.category === selectedFilter);
    }

    // Filter by status
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'completed') {
        filtered = filtered.filter(todo => todo.completed);
      } else if (selectedStatusFilter === 'pending') {
        filtered = filtered.filter(todo => !todo.completed);
      }
    }

    return filtered;
  })();

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
    const formatted = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    // Replace comma with colon after weekday
    return formatted.replace(/^(\w+),/, '$1:');
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

  // Helper function to format due date
  function formatDueDate(dateString) {
    if (!dateString || dateString === 'No due date') return 'No due date';
    
    // If it's already a formatted string (like 'Today', 'Tomorrow', 'Next Week'), return as is
    if (dateString === 'Today' || dateString === 'Tomorrow' || dateString === 'Next Week') {
      return dateString;
    }
    
    // Parse the date string (format: YYYY-MM-DD)
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
      return dateString; // Return original if not in expected format
    }
    
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed in JavaScript
    const day = parseInt(dateParts[2]);
    
    // Check if the parsed values are valid
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return dateString;
    }
    
    // Get today's date in local timezone
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();
    
    // Compare date components directly
    if (year === todayYear && month === todayMonth && day === todayDay) {
      return 'Today';
    }
    
    // Calculate tomorrow's date properly
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowYear = tomorrowDate.getFullYear();
    const tomorrowMonth = tomorrowDate.getMonth();
    const tomorrowDay = tomorrowDate.getDate();
    
    if (year === tomorrowYear && month === tomorrowMonth && day === tomorrowDay) {
      return 'Tomorrow';
    }
    
    // Create date for formatting (using local timezone)
    const date = new Date(year, month, day);
    const formatted = date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Replace comma with colon after weekday
    const finalFormatted = formatted.replace(/^(\w+),/, '$1:');
    
    return finalFormatted;
  }

  $: completedCount = todos.filter(t => t.completed).length;
  $: totalCount = todos.length;
  $: filteredCompletedCount = filteredTodos.filter(t => t.completed).length;
  $: filteredTotalCount = filteredTodos.length;
</script>

<svelte:window on:click={handleClickOutside} />

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

        <button class="add-todo-btn" on:click={addTodo} disabled={!newTodoTitle.trim() || buttonLoading}>
          {buttonLoading ? 'Adding...' : 'Add Task'}
        </button>
      </div>
    </div>
  {/if}

    <!-- Search and Filter Section -->
  <div class="search-filter-section">
    <div class="search-filter-row">
      <!-- Search Input -->
      <div class="todo-search-input-wrapper">
        <span class="material-symbols-outlined search-icon">search</span>
        <input 
          type="text" 
          class="todo-search-input" 
          placeholder="Search todos by title or description..."
          bind:value={searchQuery}
        />
        {#if searchQuery}
          <button class="clear-search-btn" on:click={() => searchQuery = ''}>
            <span class="material-symbols-outlined">close</span>
          </button>
        {/if}
      </div>

      <!-- Filter Section -->
      <div class="todo-filter-section">
        <!-- Category Filter -->
        <div class="filter-dropdown">
          <button class="filter-toggle" on:click={toggleFilterDropdown}>
            <div class="filter-toggle-content">
              <span class="material-symbols-outlined filter-icon">{getFilterIcon(selectedFilter)}</span>
              <span class="filter-label">{getFilterLabel(selectedFilter)}</span>
            </div>
            <span class="material-symbols-outlined dropdown-arrow" class:rotated={isFilterDropdownOpen}>expand_more</span>
          </button>
          
          {#if isFilterDropdownOpen}
            <div class="filter-dropdown-menu">
              {#each filterOptions as option}
                <button 
                  class="filter-dropdown-item" 
                  class:active={option.value === selectedFilter}
                  on:click={() => selectFilter(option.value)}
                >
                  <span class="material-symbols-outlined">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Status Filter -->
        <div class="filter-dropdown">
          <button class="filter-toggle" on:click={toggleStatusFilterDropdown}>
            <div class="filter-toggle-content">
              <span class="material-symbols-outlined filter-icon">{getStatusFilterIcon(selectedStatusFilter)}</span>
              <span class="filter-label">{getStatusFilterLabel(selectedStatusFilter)}</span>
            </div>
            <span class="material-symbols-outlined dropdown-arrow" class:rotated={isStatusFilterDropdownOpen}>expand_more</span>
          </button>
          
          {#if isStatusFilterDropdownOpen}
            <div class="filter-dropdown-menu">
              {#each statusFilterOptions as option}
                <button 
                  class="filter-dropdown-item" 
                  class:active={option.value === selectedStatusFilter}
                  on:click={() => selectStatusFilter(option.value)}
                >
                  <span class="material-symbols-outlined">{option.icon}</span>
                  <span>{option.label}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Todo List -->
  <div class="todos-section">
    {#if loading}
      <div class="loading-state">
        <div class="system-loader"></div>
        <p>Loading todos...</p>
      </div>
    {:else if error}
      <div class="error-state">
        <span class="material-symbols-outlined">error</span>
        <p>{error}</p>
        <button class="retry-btn" on:click={fetchTodos}>
          Retry
        </button>
      </div>
    {:else if filteredTodos.length > 0}
      <div class="todos-list">
        {#each filteredTodos as todo, index (todo.id)}
          <div class="todo-card" class:completed={todo.completed} style="--card-index: {index + 1};">
            <div class="todo-checkbox">
              <input
                type="checkbox"
                checked={todo.completed}
                on:change={() => toggleTodo(todo.id)}
                id="todo-{todo.id}"
                disabled={loading}
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
                class="action-btn todo-delete-btn"
                on:click={() => handleDeleteTodo(todo)}
                title="Delete task"
                disabled={loading}
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else if todos.length > 0}
      <div class="no-filtered-todos">
        <div class="no-todos-icon">
          <span class="material-symbols-outlined">search_off</span>
        </div>
        <h3>No Matching Tasks</h3>
        <p>No tasks match your current search or filter criteria.</p>
        <button class="clear-filters-btn" on:click={() => { searchQuery = ''; selectedFilter = 'all'; selectedStatusFilter = 'all'; }}>
          Clear all filters
        </button>
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

// Filter utility functions implementation
// This file contains pure JavaScript without import/export statements

function applyFilters(rows) {
  if (!currentOptions.filters || currentOptions.filters.length === 0) {
    return rows;
  }
  
  return rows.filter(row => {
    return currentOptions.filters.every(filter => evaluateFilter(row, filter));
  });
}

function addFilter() {
  const allFields = Object.keys(embeddedData.rows[0]);
  const newFilter = createNewFilter(allFields);
  pendingFilters.push(newFilter);
  renderUIControls();
}

function removeFilter(filterId) {
  // Remove from pending filters
  pendingFilters = pendingFilters.filter(f => f.id !== filterId);
  
  // Also remove from applied filters if it exists there
  const wasApplied = currentOptions.filters && 
    currentOptions.filters.some(f => f.id === filterId);
  
  if (wasApplied) {
    // Update applied filters
    currentOptions.filters = currentOptions.filters.filter(f => f.id !== filterId);
    // Re-render chart with updated filters
    renderChartContent();
  }
  
  // Always re-render UI controls
  renderUIControls();
}

function updateFilter(filterId, property, value) {
  const filter = pendingFilters.find(f => f.id === filterId);
  if (filter) {
    filter[property] = value;
    // Don't re-render UI controls to avoid losing focus
  }
}

function applyPendingFilters() {
  log_debug('Applying filters:', pendingFilters);
  // Save pending filters to current options (deep copy to preserve IDs)
  currentOptions.filters = pendingFilters.map(f => ({ ...f }));
  renderChartContent();
  renderUIControls();
}

function clearAllFilters() {
  pendingFilters = [];
  currentOptions.filters = [];
  renderChartContent();
  renderUIControls();
}
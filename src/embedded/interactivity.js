// Interactive functionality implementation
// This file contains pure JavaScript without import/export statements

function initializeInteractivity() {
  log_debug('Initializing interactivity');
  // Initialize visible groups
  if (currentOptions.visibleGroups === null) {
    // null means all groups are visible (default state)
    visibleGroups.clear();
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
      const group = item.getAttribute('data-group');
      visibleGroups.add(group);
    });
  } else {
    // Use saved visible groups
    visibleGroups = new Set(currentOptions.visibleGroups);
    // Update UI to reflect saved state
    const legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(item => {
      const group = item.getAttribute('data-group');
      if (!visibleGroups.has(group)) {
        hideGroup(group);
        updateLegendCheckbox(group, false);
      }
    });
  }
  
  log_debug('Visible groups initialized:', Array.from(visibleGroups));
  setupEventListeners();
}

function setupEventListeners() {
  // Legend hover and click effects
  const legendItems = document.querySelectorAll('.legend-item');
  legendItems.forEach(item => {
    const group = item.getAttribute('data-group');
    
    item.addEventListener('mouseenter', () => {
      if (visibleGroups.has(group)) {
        highlightGroup(group);
      }
    });
    
    item.addEventListener('mouseleave', () => {
      clearHighlight();
    });
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      toggleGroup(group);
    });
  });
  
  // Point hover effects
  const points = document.querySelectorAll('.chart-point');
  points.forEach(point => {
    point.addEventListener('mouseenter', () => {
      const group = point.getAttribute('data-group');
      if (visibleGroups.has(group)) {
        highlightGroup(group);
      }
    });
    
    point.addEventListener('mouseleave', () => {
      clearHighlight();
    });
  });
}

function highlightGroup(group) {
  const points = document.querySelectorAll('.chart-point');
  points.forEach(point => {
    const pointGroup = point.getAttribute('data-group');
    if (pointGroup === group) {
      point.classList.add('highlighted');
      point.classList.remove('dimmed');
    } else {
      point.classList.add('dimmed');
      point.classList.remove('highlighted');
    }
  });
}

function clearHighlight() {
  const points = document.querySelectorAll('.chart-point');
  points.forEach(point => {
    point.classList.remove('highlighted', 'dimmed');
  });
}

function toggleGroup(group) {
  log_debug('Toggling group visibility:', group);
  if (visibleGroups.has(group)) {
    visibleGroups.delete(group);
    hideGroup(group);
  } else {
    visibleGroups.add(group);
    showGroup(group);
  }
  updateLegendCheckbox(group, visibleGroups.has(group));
  
  // Save visible groups to current options
  currentOptions.visibleGroups = Array.from(visibleGroups);
  
  log_debug('Visible groups after toggle:', Array.from(visibleGroups));
}

function hideGroup(group) {
  const points = document.querySelectorAll(`[data-group="${group}"]`);
  points.forEach(point => {
    if (point.classList.contains('chart-point')) {
      point.classList.add('hidden');
    }
  });
  
  const legendItem = document.querySelector(`.legend-item[data-group="${group}"]`);
  if (legendItem) {
    legendItem.classList.add('disabled');
  }
}

function showGroup(group) {
  const points = document.querySelectorAll(`[data-group="${group}"]`);
  points.forEach(point => {
    if (point.classList.contains('chart-point')) {
      point.classList.remove('hidden');
    }
  });
  
  const legendItem = document.querySelector(`.legend-item[data-group="${group}"]`);
  if (legendItem) {
    legendItem.classList.remove('disabled');
  }
}

function updateLegendCheckbox(group, checked) {
  const checkbox = document.querySelector(`.legend-checkbox[data-group="${group}"]`);
  if (checkbox) {
    if (checked) {
      checkbox.classList.add('checked');
    } else {
      checkbox.classList.remove('checked');
    }
  }
}

// Public API functions
function setupPublicAPI() {
  // Public API for dynamic chart updates
  window.updateChart = function(newOptions) {
    log_debug('updateChart called with:', newOptions);
    currentOptions = { ...currentOptions, ...newOptions };
    renderChart();
  };
  
  window.changeAxis = function(axis, field) {
    log_debug('changeAxis called:', { axis, field });
    if (axis === 'x') {
      currentOptions.xField = field;
    } else if (axis === 'y') {
      currentOptions.yField = field;
    }
    renderChart();
  };
}

// Initialization function
function initializeChart() {
  console.log('SVG Chart loaded with', embeddedData.rows.length, 'data points');
  
  setupPublicAPI();
  
  // Initialize chart when loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderChart);
  } else {
    renderChart();
  }
}
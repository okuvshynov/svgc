export function generateSVG(chartData, data, options) {
  const { width, height } = options;
  
  // Embed the original data as JSON for the interactive UI
  const embeddedData = JSON.stringify(data);
  const embeddedOptions = JSON.stringify(options);
  
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" 
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  
  <defs>
    <style>
      .chart-point { cursor: pointer; transition: all 0.2s ease; }
      .chart-point:hover { stroke: #000; stroke-width: 2; }
      .chart-point.highlighted { opacity: 1; }
      .chart-point.dimmed { opacity: 0.3; }
      .chart-point.hidden { display: none; }
      
      .axis-line { stroke: #333; stroke-width: 1; }
      .axis-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .chart-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333; }
      
      .legend-item { cursor: pointer; transition: all 0.2s ease; }
      .legend-item:hover { opacity: 0.8; }
      .legend-item.disabled { opacity: 0.4; }
      .legend-item.disabled .legend-indicator { fill: #ccc; }
      .legend-indicator { transition: fill 0.2s ease; }
      .legend-text { font-family: Arial, sans-serif; font-size: 11px; fill: #333; }
      .legend-checkbox { stroke: #333; stroke-width: 1; fill: none; }
      .legend-checkbox.checked { fill: #333; }
      
      .ui-control { font-family: Arial, sans-serif; font-size: 12px; }
      .ui-select { font-family: Arial, sans-serif; font-size: 11px; }
    </style>
  </defs>
  
  <!-- Chart Title -->
  <text x="${width/2}" y="25" text-anchor="middle" class="chart-title">
    ${options.xField} vs ${options.yField}
  </text>
  
  <!-- Chart Area -->
  <g id="chart-area">
    ${generateAxes(chartData, options)}
    ${generatePoints(chartData)}
    ${generateLegend(chartData, options)}
  </g>
  
  <!-- Interactive UI Controls -->
  <g id="ui-controls">
    ${generateUIControls(data, options)}
  </g>
  
  <!-- Embedded Data and JavaScript -->
  <script type="text/javascript"><![CDATA[
    const embeddedData = ${embeddedData};
    const embeddedOptions = ${embeddedOptions};
    
    ${generateInteractiveScript()}
  ]]></script>
</svg>`;

  return svg;
}

function generateAxes(chartData, options) {
  const { chartBounds, xScale, yScale } = chartData;
  const { xField, yField } = options;
  
  const axes = [];
  
  // X-axis
  axes.push(`<line x1="${chartBounds.left}" y1="${chartBounds.top + chartBounds.height}" 
                   x2="${chartBounds.left + chartBounds.width}" y2="${chartBounds.top + chartBounds.height}" 
                   class="axis-line"/>`);
  
  // Y-axis
  axes.push(`<line x1="${chartBounds.left}" y1="${chartBounds.top}" 
                   x2="${chartBounds.left}" y2="${chartBounds.top + chartBounds.height}" 
                   class="axis-line"/>`);
  
  // X-axis labels
  const xTicks = generateTicks(xScale.min, xScale.max, 5);
  xTicks.forEach(tick => {
    const x = chartBounds.left + ((tick - xScale.min) / xScale.range) * chartBounds.width;
    axes.push(`<text x="${x}" y="${chartBounds.top + chartBounds.height + 20}" 
                     text-anchor="middle" class="axis-text">${formatNumber(tick)}</text>`);
  });
  
  // Y-axis labels
  const yTicks = generateTicks(yScale.min, yScale.max, 5);
  yTicks.forEach(tick => {
    const y = chartBounds.top + chartBounds.height - ((tick - yScale.min) / yScale.range) * chartBounds.height;
    axes.push(`<text x="${chartBounds.left - 10}" y="${y + 4}" 
                     text-anchor="end" class="axis-text">${formatNumber(tick)}</text>`);
  });
  
  // Axis titles
  axes.push(`<text x="${chartBounds.left + chartBounds.width/2}" y="${chartBounds.top + chartBounds.height + 45}" 
                   text-anchor="middle" class="axis-text" style="font-weight: bold;">${xField}</text>`);
  
  axes.push(`<text x="${chartBounds.left - 45}" y="${chartBounds.top + chartBounds.height/2}" 
                   text-anchor="middle" class="axis-text" style="font-weight: bold;" 
                   transform="rotate(-90, ${chartBounds.left - 45}, ${chartBounds.top + chartBounds.height/2})">${yField}</text>`);
  
  return axes.join('\\n    ');
}

function generatePoints(chartData) {
  return chartData.points.map(point => {
    return `<circle cx="${point.x}" cy="${point.y}" r="${point.radius}" 
                    fill="${point.color}" class="chart-point" 
                    data-group="${point.group}" data-index="${point.index}">
              <title>${JSON.stringify(point.data).replace(/"/g, '&quot;')}</title>
            </circle>`;
  }).join('\\n    ');
}

function generateLegend(chartData, options) {
  if (!options.groupField || chartData.groups.length <= 1) {
    return '';
  }
  
  const legendX = options.width - 180;
  const legendY = 50;
  
  const legend = [`<text x="${legendX}" y="${legendY}" class="legend-text" style="font-weight: bold;">${options.groupField}</text>`];
  
  chartData.groups.forEach((group, index) => {
    const y = legendY + 20 + index * 20;
    const color = chartData.groupColorMap[group];
    const groupId = `group-${group.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Create interactive legend item group
    legend.push(`<g class="legend-item" data-group="${group}" id="${groupId}">
      <!-- Clickable background for better UX -->
      <rect x="${legendX - 5}" y="${y - 12}" width="160" height="18" 
            fill="transparent" stroke="none"/>
      
      <!-- Checkbox indicator -->
      <rect x="${legendX}" y="${y - 8}" width="8" height="8" 
            class="legend-checkbox checked" data-group="${group}"/>
      
      <!-- Color indicator circle -->
      <circle cx="${legendX + 18}" cy="${y - 4}" r="5" 
              fill="${color}" class="legend-indicator" data-group="${group}"/>
      
      <!-- Group label -->
      <text x="${legendX + 28}" y="${y}" class="legend-text" data-group="${group}">${group}</text>
    </g>`);
  });
  
  return legend.join('\\n    ');
}

function generateUIControls(data, options) {
  // This will be implemented in the ui.js module
  return '<!-- UI controls will be added here -->';
}

function generateTicks(min, max, count) {
  const range = max - min;
  const step = range / (count - 1);
  const ticks = [];
  
  for (let i = 0; i < count; i++) {
    ticks.push(min + i * step);
  }
  
  return ticks;
}

function formatNumber(num) {
  if (Math.abs(num) >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  } else if (Math.abs(num) >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  } else if (num % 1 === 0) {
    return num.toString();
  } else {
    return num.toFixed(2);
  }
}

function generateInteractiveScript() {
  return `
    // Interactive chart functionality
    console.log('SVG Chart loaded with', embeddedData.rows.length, 'data points');
    
    // Track which groups are currently visible
    const visibleGroups = new Set();
    
    // Initialize - all groups are visible by default
    function initializeChart() {
      const legendItems = document.querySelectorAll('.legend-item');
      legendItems.forEach(item => {
        const group = item.getAttribute('data-group');
        visibleGroups.add(group);
      });
    }
    
    // Highlight points belonging to a specific group
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
    
    // Remove all highlighting
    function clearHighlight() {
      const points = document.querySelectorAll('.chart-point');
      points.forEach(point => {
        point.classList.remove('highlighted', 'dimmed');
      });
    }
    
    // Toggle group visibility
    function toggleGroup(group) {
      if (visibleGroups.has(group)) {
        visibleGroups.delete(group);
        hideGroup(group);
      } else {
        visibleGroups.add(group);
        showGroup(group);
      }
      updateLegendCheckbox(group, visibleGroups.has(group));
    }
    
    // Hide points for a specific group
    function hideGroup(group) {
      const points = document.querySelectorAll(\`[data-group="\${group}"]\`);
      points.forEach(point => {
        if (point.classList.contains('chart-point')) {
          point.classList.add('hidden');
        }
      });
      
      const legendItem = document.querySelector(\`.legend-item[data-group="\${group}"]\`);
      if (legendItem) {
        legendItem.classList.add('disabled');
      }
    }
    
    // Show points for a specific group
    function showGroup(group) {
      const points = document.querySelectorAll(\`[data-group="\${group}"]\`);
      points.forEach(point => {
        if (point.classList.contains('chart-point')) {
          point.classList.remove('hidden');
        }
      });
      
      const legendItem = document.querySelector(\`.legend-item[data-group="\${group}"]\`);
      if (legendItem) {
        legendItem.classList.remove('disabled');
      }
    }
    
    // Update legend checkbox visual state
    function updateLegendCheckbox(group, checked) {
      const checkbox = document.querySelector(\`.legend-checkbox[data-group="\${group}"]\`);
      if (checkbox) {
        if (checked) {
          checkbox.classList.add('checked');
        } else {
          checkbox.classList.remove('checked');
        }
      }
    }
    
    // Set up event listeners
    function setupInteractivity() {
      // Legend hover effects
      const legendItems = document.querySelectorAll('.legend-item');
      legendItems.forEach(item => {
        const group = item.getAttribute('data-group');
        
        // Hover to highlight
        item.addEventListener('mouseenter', () => {
          if (visibleGroups.has(group)) {
            highlightGroup(group);
          }
        });
        
        item.addEventListener('mouseleave', () => {
          clearHighlight();
        });
        
        // Click to toggle visibility
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
    
    // Initialize when SVG is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        initializeChart();
        setupInteractivity();
      });
    } else {
      initializeChart();
      setupInteractivity();
    }
  `;
}
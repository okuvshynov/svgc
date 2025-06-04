// SVG element generation utilities for building chart components

export function generateCSS() {
  return `
    <style>
      .chart-point { cursor: pointer; transition: all 0.2s ease; }
      .chart-point:hover { stroke: #000; stroke-width: 2; }
      .chart-point.highlighted { opacity: 1; }
      .chart-point.dimmed { opacity: 0.1; }
      .chart-point.hidden { display: none; }
      
      .axis-line { stroke: #333; stroke-width: 1; }
      .axis-tick { stroke: #333; stroke-width: 1; }
      .grid-line { stroke: #e0e0e0; stroke-width: 1; stroke-dasharray: 2,2; opacity: 0.6; }
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
      
      /* HTML Select styling handled inline in foreignObject */
      
      .ui-label {
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: bold;
        fill: #333;
      }
    </style>
  `;
}

export function generateAxes(chartData, options) {
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
  
  // Generate all possible ticks
  const allXTicks = generateTicks(xScale.min, xScale.max, 5);
  const allYTicks = generateTicks(yScale.min, yScale.max, 5);
  
  // Filter ticks to only show those within the chart bounds
  const xTicks = allXTicks.filter(tick => tick >= xScale.min && tick <= xScale.max);
  const yTicks = allYTicks.filter(tick => tick >= yScale.min && tick <= yScale.max);
  
  // X-axis grid lines (vertical)
  xTicks.forEach(tick => {
    const x = chartBounds.left + ((tick - xScale.min) / xScale.range) * chartBounds.width;
    
    // Only add grid line if it's not at the edge (Y-axis)
    if (Math.abs(x - chartBounds.left) > 1) {
      axes.push(`<line x1="${x}" y1="${chartBounds.top}" 
                       x2="${x}" y2="${chartBounds.top + chartBounds.height}" 
                       class="grid-line"/>`);
    }
  });
  
  // Y-axis grid lines (horizontal)
  yTicks.forEach(tick => {
    const y = chartBounds.top + chartBounds.height - ((tick - yScale.min) / yScale.range) * chartBounds.height;
    
    // Only add grid line if it's not at the edge (X-axis)
    if (Math.abs(y - (chartBounds.top + chartBounds.height)) > 1) {
      axes.push(`<line x1="${chartBounds.left}" y1="${y}" 
                       x2="${chartBounds.left + chartBounds.width}" y2="${y}" 
                       class="grid-line"/>`);
    }
  });
  
  // X-axis tick marks and labels
  xTicks.forEach(tick => {
    const x = chartBounds.left + ((tick - xScale.min) / xScale.range) * chartBounds.width;
    
    // Tick mark
    axes.push(`<line x1="${x}" y1="${chartBounds.top + chartBounds.height}" 
                     x2="${x}" y2="${chartBounds.top + chartBounds.height + 5}" 
                     class="axis-tick"/>`);
    
    // Label
    axes.push(`<text x="${x}" y="${chartBounds.top + chartBounds.height + 18}" 
                     text-anchor="middle" class="axis-text">${formatNumber(tick)}</text>`);
  });
  
  // Y-axis tick marks and labels
  yTicks.forEach(tick => {
    const y = chartBounds.top + chartBounds.height - ((tick - yScale.min) / yScale.range) * chartBounds.height;
    
    // Tick mark
    axes.push(`<line x1="${chartBounds.left - 5}" y1="${y}" 
                     x2="${chartBounds.left}" y2="${y}" 
                     class="axis-tick"/>`);
    
    // Label
    axes.push(`<text x="${chartBounds.left - 10}" y="${y + 4}" 
                     text-anchor="end" class="axis-text">${formatNumber(tick)}</text>`);
  });
  
  // Axis titles
  axes.push(`<text x="${chartBounds.left + chartBounds.width/2}" y="${chartBounds.top + chartBounds.height + 45}" 
                   text-anchor="middle" class="axis-text" style="font-weight: bold;">${xField}</text>`);
  
  axes.push(`<text x="${chartBounds.left - 60}" y="${chartBounds.top + chartBounds.height/2}" 
                   text-anchor="middle" class="axis-text" style="font-weight: bold;" 
                   transform="rotate(-90, ${chartBounds.left - 60}, ${chartBounds.top + chartBounds.height/2})">${yField}</text>`);
  
  return axes.join('\\n    ');
}

export function generatePoints(chartData) {
  return chartData.points.map(point => {
    return `<circle cx="${point.x}" cy="${point.y}" r="${point.radius}" 
                    fill="${point.color}" class="chart-point" 
                    data-group="${point.group}" data-index="${point.index}">
              <title>${JSON.stringify(point.data).replace(/"/g, '&quot;')}</title>
            </circle>`;
  }).join('\\n    ');
}

export function generateLegend(chartData, options) {
  if (!options.groupField || chartData.groups.length <= 1) {
    return '';
  }
  
  const legendX = options.width - 180;
  const legendY = 50;
  
  const legend = [`<text x="${legendX}" y="${legendY}" class="legend-text" style="font-weight: bold;">${options.groupField}</text>`];
  
  chartData.groups.forEach((group, index) => {
    const y = legendY + 20 + index * 20;
    const color = chartData.groupColorMap[group];
    const groupId = `group-${String(group).replace(/[^a-zA-Z0-9]/g, '-')}`;
    
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

export function generateUIControls(data, options) {
  // This will be implemented in the ui.js module
  return '<!-- UI controls will be added here -->';
}
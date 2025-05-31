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
      .chart-point { cursor: pointer; }
      .chart-point:hover { stroke: #000; stroke-width: 2; }
      .axis-line { stroke: #333; stroke-width: 1; }
      .axis-text { font-family: Arial, sans-serif; font-size: 12px; fill: #333; }
      .chart-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #333; }
      .legend-text { font-family: Arial, sans-serif; font-size: 11px; fill: #333; }
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
  
  const legendX = options.width - 150;
  const legendY = 50;
  
  const legend = [`<text x="${legendX}" y="${legendY}" class="legend-text" style="font-weight: bold;">${options.groupField}</text>`];
  
  chartData.groups.forEach((group, index) => {
    const y = legendY + 20 + index * 18;
    const color = chartData.groupColorMap[group];
    
    legend.push(`<circle cx="${legendX + 10}" cy="${y - 4}" r="5" fill="${color}"/>`);
    legend.push(`<text x="${legendX + 20}" y="${y}" class="legend-text">${group}</text>`);
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
    // Interactive functionality will be added here
    console.log('SVG Chart loaded with', embeddedData.rows.length, 'data points');
    
    // Add hover effects and interactivity
    document.addEventListener('DOMContentLoaded', function() {
      // This will be enhanced with more interactive features
    });
  `;
}
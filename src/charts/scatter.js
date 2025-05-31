export function generateScatterChart(data, options) {
  const { width, height, padding = 60 } = options;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;
  
  // Calculate scales
  const xValues = data.rows.map(row => row[options.xField]).filter(v => typeof v === 'number');
  const yValues = data.rows.map(row => row[options.yField]).filter(v => typeof v === 'number');
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  // Add some padding to the scales
  const xRange = xMax - xMin;
  const yRange = yMax - yMin;
  
  // Handle case where all values are the same (range = 0)
  const xPadding = xRange > 0 ? xRange * 0.05 : Math.abs(xMin) * 0.1 || 1;
  const yPadding = yRange > 0 ? yRange * 0.05 : Math.abs(yMin) * 0.1 || 1;
  
  const xScale = {
    min: xMin - xPadding,
    max: xMax + xPadding,
    range: Math.max(xRange + 2 * xPadding, 2 * xPadding)
  };
  
  const yScale = {
    min: yMin - yPadding,
    max: yMax + yPadding,
    range: Math.max(yRange + 2 * yPadding, 2 * yPadding)
  };
  
  // Get unique groups for coloring
  const groups = options.groupField ? 
    [...new Set(data.rows.map(row => row[options.groupField]))] : 
    ['default'];
  
  const colors = generateColors(groups.length);
  const groupColorMap = {};
  groups.forEach((group, index) => {
    groupColorMap[group] = colors[index];
  });
  
  // Generate chart elements
  const points = data.rows.map((row, index) => {
    const x = row[options.xField];
    const y = row[options.yField];
    
    if (typeof x !== 'number' || typeof y !== 'number') {
      return null;
    }
    
    const svgX = padding + ((x - xScale.min) / xScale.range) * chartWidth;
    const svgY = padding + chartHeight - ((y - yScale.min) / yScale.range) * chartHeight;
    
    const group = options.groupField ? row[options.groupField] : 'default';
    const weight = options.weightField ? row[options.weightField] : 1;
    const radius = Math.max(2, Math.min(10, 3 + Math.sqrt(weight) * 2));
    
    return {
      x: svgX,
      y: svgY,
      radius,
      color: groupColorMap[group],
      group,
      data: row,
      index
    };
  }).filter(p => p !== null);
  
  return {
    points,
    xScale,
    yScale,
    groupColorMap,
    groups,
    chartBounds: {
      left: padding,
      top: padding,
      width: chartWidth,
      height: chartHeight
    }
  };
}

function generateColors(count) {
  // Generate a set of distinct colors
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // Generate more colors using HSL
  const result = [...colors];
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation
    result.push(`hsl(${hue}, 70%, 50%)`);
  }
  
  return result;
}
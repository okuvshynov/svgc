// Histogram chart implementation
// This module handles histogram/bar chart generation from CSV data

// Server-side histogram generation (for initial render)
export function generateHistogram(data, field, numBins = 10) {
  // Get all values for the specified field
  const values = data.rows
    .map(row => row[field])
    .filter(v => v !== null && v !== undefined);
  
  // Handle empty data
  if (values.length === 0) {
    return {
      type: 'categorical',
      bins: [],
      maxCount: 0
    };
  }
  
  // Separate numeric and string values
  const numericValues = values.filter(v => typeof v === 'number');
  const stringValues = values.filter(v => typeof v === 'string');
  
  if (numericValues.length > 0 && stringValues.length === 0) {
    // Numeric histogram
    return generateNumericHistogram(numericValues, numBins);
  } else if (stringValues.length > 0 && numericValues.length === 0) {
    // Categorical bar chart
    return generateCategoricalHistogram(values);
  } else {
    // Mixed data - treat as categorical
    return generateCategoricalHistogram(values.map(v => String(v)));
  }
}

function generateNumericHistogram(values, numBins) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Handle edge case where all values are the same
  if (range === 0) {
    return {
      type: 'numeric',
      bins: [{
        min: min,
        max: max,
        count: values.length,
        label: String(min)
      }],
      min: min,
      max: max,
      maxCount: values.length
    };
  }
  
  // Calculate bin width
  const binWidth = range / numBins;
  
  // Initialize bins
  const bins = [];
  for (let i = 0; i < numBins; i++) {
    const binMin = min + i * binWidth;
    const binMax = i === numBins - 1 ? max : min + (i + 1) * binWidth;
    bins.push({
      min: binMin,
      max: binMax,
      count: 0,
      label: formatBinLabel(binMin, binMax, binWidth)
    });
  }
  
  // Count values in each bin
  values.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), numBins - 1);
    bins[binIndex].count++;
  });
  
  const maxCount = Math.max(...bins.map(b => b.count));
  
  return {
    type: 'numeric',
    bins: bins,
    min: min,
    max: max,
    maxCount: maxCount
  };
}

function generateCategoricalHistogram(values) {
  // Count occurrences of each category
  const counts = {};
  values.forEach(value => {
    counts[value] = (counts[value] || 0) + 1;
  });
  
  // Convert to bins array and sort by count (descending)
  const bins = Object.entries(counts)
    .map(([label, count]) => ({
      label: label,
      count: count
    }))
    .sort((a, b) => b.count - a.count);
  
  const maxCount = bins.length > 0 ? Math.max(...bins.map(b => b.count)) : 0;
  
  return {
    type: 'categorical',
    bins: bins,
    maxCount: maxCount
  };
}

function formatBinLabel(min, max, binWidth) {
  // Smart formatting based on the scale
  const formatNum = (num) => {
    if (binWidth >= 1) {
      return num.toFixed(0);
    } else if (binWidth >= 0.1) {
      return num.toFixed(1);
    } else if (binWidth >= 0.01) {
      return num.toFixed(2);
    } else {
      return num.toFixed(3);
    }
  };
  
  return `${formatNum(min)}-${formatNum(max)}`;
}

export function suggestBinCount(values) {
  // Sturges' rule: k = 1 + 3.322 * log10(n)
  const n = values.length;
  if (n === 0) return 10;
  
  const sturges = Math.ceil(1 + 3.322 * Math.log10(n));
  
  // Limit to reasonable range
  return Math.max(5, Math.min(50, sturges));
}
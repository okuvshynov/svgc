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
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  
  // Handle edge case where all values are the same
  if (range === 0) {
    return {
      type: 'numeric',
      bins: [{
        min: dataMin,
        max: dataMax,
        count: values.length,
        label: String(dataMin)
      }],
      min: dataMin,
      max: dataMax,
      maxCount: values.length
    };
  }
  
  // Generate nice boundaries using smart tick generation
  const { niceMin, niceMax, niceBinWidth, actualBinCount } = calculateNiceBins(dataMin, dataMax, numBins);
  
  // Initialize bins with nice boundaries
  const bins = [];
  for (let i = 0; i < actualBinCount; i++) {
    const binMin = niceMin + i * niceBinWidth;
    const binMax = niceMin + (i + 1) * niceBinWidth;
    bins.push({
      min: binMin,
      max: binMax,
      count: 0,
      label: formatNiceBinLabel(binMin, binMax, niceBinWidth)
    });
  }
  
  // Count values in each bin
  values.forEach(value => {
    // Find which bin this value belongs to
    const binIndex = Math.floor((value - niceMin) / niceBinWidth);
    // Clamp to valid range (handle edge cases where value equals niceMax)
    const clampedIndex = Math.max(0, Math.min(bins.length - 1, binIndex));
    bins[clampedIndex].count++;
  });
  
  const maxCount = Math.max(...bins.map(b => b.count));
  
  return {
    type: 'numeric',
    bins: bins,
    min: niceMin,
    max: niceMax,
    maxCount: maxCount
  };
}

function calculateNiceBins(dataMin, dataMax, targetBinCount) {
  const range = dataMax - dataMin;
  const roughBinWidth = range / targetBinCount;
  
  // Find nice bin width using the same logic as axis ticks
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughBinWidth)));
  const normalized = roughBinWidth / magnitude;
  
  let niceBinWidth;
  if (normalized <= 1) {
    niceBinWidth = 1 * magnitude;
  } else if (normalized <= 2) {
    niceBinWidth = 2 * magnitude;
  } else if (normalized <= 2.5) {
    niceBinWidth = 2.5 * magnitude;
  } else if (normalized <= 5) {
    niceBinWidth = 5 * magnitude;
  } else {
    niceBinWidth = 10 * magnitude;
  }
  
  // Calculate nice min and max that encompass all data
  const niceMin = Math.floor(dataMin / niceBinWidth) * niceBinWidth;
  const niceMax = Math.ceil(dataMax / niceBinWidth) * niceBinWidth;
  
  // Calculate actual number of bins
  const actualBinCount = Math.round((niceMax - niceMin) / niceBinWidth);
  
  return {
    niceMin,
    niceMax,
    niceBinWidth,
    actualBinCount
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

function formatNiceBinLabel(min, max, binWidth) {
  // Format numbers using scientific notation for large numbers
  const formatNum = (num) => {
    if (num === 0) return '0';
    
    const absNum = Math.abs(num);
    
    // Use scientific notation for very large or very small numbers
    if (absNum >= 1e6 || (absNum < 1e-3 && absNum > 0)) {
      const exponent = Math.floor(Math.log10(absNum));
      const mantissa = num / Math.pow(10, exponent);
      
      // Format mantissa to avoid unnecessary decimals
      const formattedMantissa = mantissa % 1 === 0 ? 
        mantissa.toString() : 
        mantissa.toFixed(1);
      
      return `${formattedMantissa}×10^${exponent}`;
    } else if (absNum >= 1) {
      // For numbers >= 1 but < 1e6
      if (num % 1 === 0) {
        return num.toString();
      } else if (binWidth >= 1) {
        return num.toFixed(0);
      } else if (binWidth >= 0.1) {
        return num.toFixed(1);
      } else {
        return num.toFixed(2);
      }
    } else {
      // For small decimals >= 1e-3
      if (binWidth >= 0.01) {
        return num.toFixed(2);
      } else if (binWidth >= 0.001) {
        return num.toFixed(3);
      } else {
        return num.toFixed(4);
      }
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
// Utility functions for number formatting and calculations

export function generateTicks(min, max, targetCount) {
  if (min === max) {
    return [min];
  }
  
  const range = max - min;
  
  // Calculate rough step size
  const roughStep = range / (targetCount - 1);
  
  // Find nice step size (1, 2, 2.5, 5) * 10^k
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  
  let niceStep;
  if (normalized <= 1) {
    niceStep = 1 * magnitude;
  } else if (normalized <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalized <= 2.5) {
    niceStep = 2.5 * magnitude;
  } else if (normalized <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }
  
  // Find nice start and end values
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  
  // Generate ticks
  const ticks = [];
  for (let tick = niceMin; tick <= niceMax + niceStep * 0.001; tick += niceStep) {
    // Round to avoid floating point precision issues
    const roundedTick = Math.round(tick / niceStep) * niceStep;
    ticks.push(roundedTick);
  }
  
  return ticks;
}

export function formatNumber(num) {
  // Handle zero
  if (num === 0) {
    return '0';
  }
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    // Billions: keep it compact
    const billions = num / 1e9;
    return billions % 1 === 0 ? billions.toString() + 'B' : billions.toFixed(1) + 'B';
  } else if (absNum >= 1e6) {
    // Millions: keep it compact  
    const millions = num / 1e6;
    return millions % 1 === 0 ? millions.toString() + 'M' : millions.toFixed(1) + 'M';
  } else if (absNum >= 1e3) {
    // Thousands: show 1 decimal if needed, otherwise integer
    const thousands = num / 1e3;
    return thousands % 1 === 0 ? thousands.toString() + 'K' : thousands.toFixed(1) + 'K';
  } else if (absNum >= 1) {
    // Regular numbers: show decimals only if needed
    if (num % 1 === 0) {
      return num.toString();
    } else if (num % 0.1 === 0) {
      return num.toFixed(1);
    } else {
      return num.toFixed(2);
    }
  } else {
    // Small numbers: use appropriate precision
    if (num % 0.01 === 0) {
      return num.toFixed(2);
    } else if (num % 0.001 === 0) {
      return num.toFixed(3);
    } else {
      return num.toFixed(4);
    }
  }
}
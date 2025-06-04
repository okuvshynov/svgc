// Utility functions for chart generation

export function generateTicks(min, max, targetCount) {
  if (min === max) {
    return [min];
  }
  
  const range = max - min;
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
  
  const niceMin = Math.floor(min / niceStep) * niceStep;
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  
  const ticks = [];
  for (let tick = niceMin; tick <= niceMax + niceStep * 0.001; tick += niceStep) {
    const roundedTick = Math.round(tick / niceStep) * niceStep;
    ticks.push(roundedTick);
  }
  
  return ticks;
}

export function formatNumber(num) {
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
    if (num % 1 === 0) {
      return num.toString();
    } else if (num % 0.1 === 0) {
      return num.toFixed(1);
    } else {
      return num.toFixed(2);
    }
  } else {
    if (num % 0.01 === 0) {
      return num.toFixed(2);
    } else if (num % 0.001 === 0) {
      return num.toFixed(3);
    } else {
      return num.toFixed(4);
    }
  }
}

export function generateColors(count) {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  const result = [...colors];
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    result.push(`hsl(${hue}, 70%, 50%)`);
  }
  
  return result;
}

export function createSVGElement(tag, attributes = {}) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}
// Filter management functions for chart filtering

export function applyFilters(rows, filters) {
  if (!filters || filters.length === 0) {
    return rows;
  }
  
  return rows.filter(row => {
    return filters.every(filter => evaluateFilter(row, filter));
  });
}

export function evaluateFilter(row, filter) {
  const value = row[filter.field];
  const filterValue = filter.value;
  
  // Convert filter value to appropriate type
  let typedFilterValue = filterValue;
  if (typeof value === 'number' && !isNaN(Number(filterValue))) {
    typedFilterValue = Number(filterValue);
  }
  
  switch (filter.operator) {
    case '=': return value == typedFilterValue;
    case '!=': return value != typedFilterValue;
    case '>': return value > typedFilterValue;
    case '<': return value < typedFilterValue;
    case '>=': return value >= typedFilterValue;
    case '<=': return value <= typedFilterValue;
    case 'contains': return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'starts_with': return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
    case 'ends_with': return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
    default: return true;
  }
}

export function createNewFilter(fields) {
  return {
    id: Date.now(),
    field: fields[0],
    operator: '=',
    value: ''
  };
}
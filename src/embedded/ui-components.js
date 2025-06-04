// UI component functions for creating interactive controls

import { createSVGElement } from './chart-utils.js';

export function createValueInput(x, y, width, currentValue, onChange) {
  const foreignObject = createSVGElement('foreignObject', {
    x: x,
    y: y,
    width: width,
    height: 22
  });
  
  const input = document.createElementNS('http://www.w3.org/1999/xhtml', 'input');
  input.setAttribute('type', 'text');
  input.setAttribute('value', currentValue);
  input.setAttribute('style', 
    `width: ${width-4}px; height: 18px; font-family: Arial, sans-serif; font-size: 10px; ` +
    'border: 1px solid #ccc; border-radius: 3px; padding: 1px;'
  );
  
  input.addEventListener('input', (e) => {
    onChange(e.target.value);
  });
  
  foreignObject.appendChild(input);
  return foreignObject;
}

export function createRemoveButton(x, y, filterId, onRemove) {
  const group = createSVGElement('g', { class: 'remove-filter-btn', style: 'cursor: pointer;' });
  
  // Background
  const bg = createSVGElement('rect', {
    x: x,
    y: y + 2,
    width: 16,
    height: 16,
    fill: '#ff6b6b',
    stroke: '#ff5252',
    'stroke-width': 1,
    rx: 3
  });
  group.appendChild(bg);
  
  // X symbol
  const xText = createSVGElement('text', {
    x: x + 8,
    y: y + 13,
    'text-anchor': 'middle',
    style: 'font-family: Arial, sans-serif; font-size: 12px; font-weight: bold; fill: white; pointer-events: none;'
  });
  xText.textContent = '×';
  group.appendChild(xText);
  
  group.addEventListener('click', () => {
    onRemove(filterId);
  });
  
  return group;
}

export function createButton(x, y, width, height, text, className, colors, onClick) {
  const group = createSVGElement('g', { class: className, style: 'cursor: pointer;' });
  
  // Background
  const bg = createSVGElement('rect', {
    x: x,
    y: y,
    width: width,
    height: height,
    fill: colors.fill,
    stroke: colors.stroke,
    'stroke-width': 1,
    rx: 3
  });
  group.appendChild(bg);
  
  // Text
  const textElement = createSVGElement('text', {
    x: x + width/2,
    y: y + height/2 + 4,
    'text-anchor': 'middle',
    style: 'font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; fill: white; pointer-events: none;'
  });
  textElement.textContent = text;
  group.appendChild(textElement);
  
  group.addEventListener('click', onClick);
  
  return group;
}

export function createAddFilterButton(x, y, width, onAdd) {
  return createButton(x, y, width, 20, '+ Add', 'add-filter-btn', 
    { fill: '#4CAF50', stroke: '#45a049' }, onAdd);
}

export function createApplyFiltersButton(x, y, width, onApply) {
  return createButton(x, y, width, 20, 'Apply Filters', 'apply-filters-btn',
    { fill: '#2196F3', stroke: '#1976D2' }, onApply);
}

export function createClearAllButton(x, y, width, onClear) {
  return createButton(x, y, width, 20, 'Clear All', 'clear-all-btn',
    { fill: '#f44336', stroke: '#d32f2f' }, onClear);
}

export function createSaveButton(x, y, width, onSave) {
  const group = createSVGElement('g', { class: 'save-btn', style: 'cursor: pointer;' });
  
  // Background
  const bg = createSVGElement('rect', {
    x: x,
    y: y,
    width: width,
    height: 30,
    fill: '#673AB7',
    stroke: '#512DA8',
    'stroke-width': 1,
    rx: 4
  });
  group.appendChild(bg);
  
  // Icon - simple floppy disk shape
  const iconGroup = createSVGElement('g', {
    transform: `translate(${x + 15}, ${y + 7})`
  });
  
  // Floppy disk body
  iconGroup.appendChild(createSVGElement('rect', {
    x: 0, y: 0, width: 16, height: 16,
    fill: 'white', stroke: 'none'
  }));
  
  // Floppy disk shutter
  iconGroup.appendChild(createSVGElement('rect', {
    x: 3, y: 0, width: 10, height: 6,
    fill: '#673AB7', stroke: 'none'
  }));
  
  // Floppy disk label area
  iconGroup.appendChild(createSVGElement('rect', {
    x: 2, y: 8, width: 12, height: 6,
    fill: '#673AB7', stroke: 'none'
  }));
  
  group.appendChild(iconGroup);
  
  // Text
  const text = createSVGElement('text', {
    x: x + width/2 + 5,
    y: y + 19,
    'text-anchor': 'middle',
    style: 'font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; fill: white; pointer-events: none;'
  });
  text.textContent = 'Save Current View';
  group.appendChild(text);
  
  group.addEventListener('click', onSave);
  
  return group;
}

export function createUIGroup(x, y, label, currentValue, options, onChange, width = 130) {
  const group = createSVGElement('g');
  
  // Label (only if provided)
  if (label) {
    const labelText = createSVGElement('text', {
      x: x,
      y: y - 5,
      class: 'ui-label'
    });
    labelText.textContent = label;
    group.appendChild(labelText);
  }
  
  // Create foreignObject for HTML select
  const foreignObject = createSVGElement('foreignObject', {
    x: x,
    y: y,
    width: width,
    height: 22
  });
  
  // Create HTML select element in XHTML namespace
  const selectElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'select');
  
  // Set style attribute as string since we're in XML context
  selectElement.setAttribute('style', 
    `width: ${width}px; height: 20px; font-family: Arial, sans-serif; font-size: 11px; ` +
    'border: 1px solid #ccc; border-radius: 3px; background: white; padding: 2px; outline: none;'
  );
  
  // Add options to select
  options.forEach(option => {
    const optionElement = document.createElementNS('http://www.w3.org/1999/xhtml', 'option');
    optionElement.setAttribute('value', option);
    optionElement.textContent = option;
    if (option === currentValue) {
      optionElement.setAttribute('selected', 'selected');
    }
    selectElement.appendChild(optionElement);
  });
  
  // Add event listener
  selectElement.addEventListener('change', (e) => {
    onChange(e.target.value);
  });
  
  foreignObject.appendChild(selectElement);
  
  group.appendChild(foreignObject);
  return group;
}
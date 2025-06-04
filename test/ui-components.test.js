import { test } from 'node:test';
import assert from 'node:assert';
import { 
  createValueInput, 
  createRemoveButton, 
  createButton,
  createAddFilterButton,
  createApplyFiltersButton,
  createClearAllButton,
  createSaveButton,
  createUIGroup
} from '../src/embedded/ui-components-impl.js';

test('UI Components', async (t) => {
  // Setup minimal mock for DOM
  t.beforeEach(() => {
    // Mock document.createElementNS for SVG and HTML element creation
    global.document = {
      createElementNS: (namespace, tagName) => {
        const element = {
          namespaceURI: namespace,
          tagName: tagName,
          attributes: {},
          children: [],
          textContent: '',
          style: {},
          setAttribute: function(key, value) {
            this.attributes[key] = String(value);
            if (key === 'style') {
              // Parse basic style properties for testing
              const styles = value.split(';').filter(s => s.trim());
              styles.forEach(style => {
                const [prop, val] = style.split(':').map(s => s.trim());
                if (prop && val) {
                  this.style[prop] = val;
                }
              });
            }
          },
          getAttribute: function(key) {
            return this.attributes[key] || null;
          },
          appendChild: function(child) {
            this.children.push(child);
            return child;
          },
          addEventListener: function(event, handler) {
            this._eventHandlers = this._eventHandlers || {};
            this._eventHandlers[event] = handler;
          },
          dispatchEvent: function(event) {
            if (this._eventHandlers && this._eventHandlers[event.type]) {
              this._eventHandlers[event.type](event);
            }
          }
        };
        return element;
      }
    };
  });

  t.afterEach(() => {
    delete global.document;
  });

  await t.test('createValueInput', async (t) => {
    await t.test('should create input element with correct attributes', () => {
      let capturedValue = null;
      const onChange = (value) => { capturedValue = value; };
      
      const input = createValueInput(10, 20, 100, 'initial value', onChange);
      
      assert.strictEqual(input.tagName, 'foreignObject');
      assert.strictEqual(input.getAttribute('x'), '10');
      assert.strictEqual(input.getAttribute('y'), '20');
      assert.strictEqual(input.getAttribute('width'), '100');
      assert.strictEqual(input.getAttribute('height'), '22');
      
      // Check the inner input element
      const htmlInput = input.children[0];
      assert.strictEqual(htmlInput.tagName, 'input');
      assert.strictEqual(htmlInput.getAttribute('type'), 'text');
      assert.strictEqual(htmlInput.getAttribute('value'), 'initial value');
    });

    await t.test('should call onChange when input changes', () => {
      let capturedValue = null;
      const onChange = (value) => { capturedValue = value; };
      
      const input = createValueInput(0, 0, 50, 'test', onChange);
      const htmlInput = input.children[0];
      
      // Simulate input event
      htmlInput.dispatchEvent({ type: 'input', target: { value: 'new value' } });
      
      assert.strictEqual(capturedValue, 'new value');
    });
  });

  await t.test('createRemoveButton', async (t) => {
    await t.test('should create button with correct structure', () => {
      const button = createRemoveButton(100, 50, 'filter-123', () => {});
      
      assert.strictEqual(button.tagName, 'g');
      assert.strictEqual(button.getAttribute('class'), 'remove-filter-btn');
      assert.strictEqual(button.getAttribute('style'), 'cursor: pointer;');
      
      // Check background rect
      const bg = button.children[0];
      assert.strictEqual(bg.tagName, 'rect');
      assert.strictEqual(bg.getAttribute('x'), '100');
      assert.strictEqual(bg.getAttribute('y'), '52'); // y + 2
      assert.strictEqual(bg.getAttribute('fill'), '#ff6b6b');
      
      // Check text
      const text = button.children[1];
      assert.strictEqual(text.tagName, 'text');
      assert.strictEqual(text.textContent, '×');
    });

    await t.test('should call onRemove with filterId when clicked', () => {
      let capturedId = null;
      const onRemove = (id) => { capturedId = id; };
      
      const button = createRemoveButton(0, 0, 'test-id', onRemove);
      button.dispatchEvent({ type: 'click' });
      
      assert.strictEqual(capturedId, 'test-id');
    });
  });

  await t.test('createButton', async (t) => {
    await t.test('should create generic button with provided properties', () => {
      let clicked = false;
      const onClick = () => { clicked = true; };
      
      const button = createButton(50, 100, 120, 30, 'Test Button', 'test-class', 
        { fill: '#123456', stroke: '#789abc' }, onClick);
      
      assert.strictEqual(button.tagName, 'g');
      assert.strictEqual(button.getAttribute('class'), 'test-class');
      
      // Check background
      const bg = button.children[0];
      assert.strictEqual(bg.getAttribute('x'), '50');
      assert.strictEqual(bg.getAttribute('y'), '100');
      assert.strictEqual(bg.getAttribute('width'), '120');
      assert.strictEqual(bg.getAttribute('height'), '30');
      assert.strictEqual(bg.getAttribute('fill'), '#123456');
      assert.strictEqual(bg.getAttribute('stroke'), '#789abc');
      
      // Check text
      const text = button.children[1];
      assert.strictEqual(text.textContent, 'Test Button');
      assert.strictEqual(text.getAttribute('x'), '110'); // x + width/2
      assert.strictEqual(text.getAttribute('y'), '119'); // y + height/2 + 4
    });

    await t.test('should handle click events', () => {
      let clicked = false;
      const onClick = () => { clicked = true; };
      
      const button = createButton(0, 0, 100, 20, 'Click Me', 'btn', 
        { fill: '#000', stroke: '#fff' }, onClick);
      
      button.dispatchEvent({ type: 'click' });
      assert.strictEqual(clicked, true);
    });
  });

  await t.test('createAddFilterButton', async (t) => {
    await t.test('should create add filter button with correct styling', () => {
      const button = createAddFilterButton(10, 20, 80, () => {});
      
      assert.strictEqual(button.getAttribute('class'), 'add-filter-btn');
      
      const bg = button.children[0];
      assert.strictEqual(bg.getAttribute('fill'), '#4CAF50');
      assert.strictEqual(bg.getAttribute('stroke'), '#45a049');
      assert.strictEqual(bg.getAttribute('width'), '80');
      assert.strictEqual(bg.getAttribute('height'), '20');
      
      const text = button.children[1];
      assert.strictEqual(text.textContent, '+ Add');
    });

    await t.test('should call onAdd when clicked', () => {
      let addCalled = false;
      const onAdd = () => { addCalled = true; };
      
      const button = createAddFilterButton(0, 0, 100, onAdd);
      button.dispatchEvent({ type: 'click' });
      
      assert.strictEqual(addCalled, true);
    });
  });

  await t.test('createApplyFiltersButton', async (t) => {
    await t.test('should create apply filters button with correct styling', () => {
      const button = createApplyFiltersButton(10, 20, 90, () => {});
      
      assert.strictEqual(button.getAttribute('class'), 'apply-filters-btn');
      
      const bg = button.children[0];
      assert.strictEqual(bg.getAttribute('fill'), '#2196F3');
      assert.strictEqual(bg.getAttribute('stroke'), '#1976D2');
      
      const text = button.children[1];
      assert.strictEqual(text.textContent, 'Apply Filters');
    });
  });

  await t.test('createClearAllButton', async (t) => {
    await t.test('should create clear all button with correct styling', () => {
      const button = createClearAllButton(10, 20, 70, () => {});
      
      assert.strictEqual(button.getAttribute('class'), 'clear-all-btn');
      
      const bg = button.children[0];
      assert.strictEqual(bg.getAttribute('fill'), '#f44336');
      assert.strictEqual(bg.getAttribute('stroke'), '#d32f2f');
      
      const text = button.children[1];
      assert.strictEqual(text.textContent, 'Clear All');
    });
  });

  await t.test('createSaveButton', async (t) => {
    await t.test('should create save button with icon and text', () => {
      const button = createSaveButton(10, 20, 150, () => {});
      
      assert.strictEqual(button.getAttribute('class'), 'save-btn');
      
      const bg = button.children[0];
      assert.strictEqual(bg.getAttribute('height'), '30');
      assert.strictEqual(bg.getAttribute('fill'), '#673AB7');
      
      // Check icon group
      const iconGroup = button.children[1];
      assert.strictEqual(iconGroup.tagName, 'g');
      assert.strictEqual(iconGroup.getAttribute('transform'), 'translate(25, 27)'); // x + 15, y + 7
      
      // Icon should have 3 rectangles (body, shutter, label)
      assert.strictEqual(iconGroup.children.length, 3);
      
      // Check text
      const text = button.children[2];
      assert.strictEqual(text.textContent, 'Save Current View');
    });

    await t.test('should call onSave when clicked', () => {
      let saveCalled = false;
      const onSave = () => { saveCalled = true; };
      
      const button = createSaveButton(0, 0, 150, onSave);
      button.dispatchEvent({ type: 'click' });
      
      assert.strictEqual(saveCalled, true);
    });
  });

  await t.test('createUIGroup', async (t) => {
    await t.test('should create dropdown with label', () => {
      const group = createUIGroup(10, 50, 'Field:', 'option2', 
        ['option1', 'option2', 'option3'], () => {});
      
      assert.strictEqual(group.tagName, 'g');
      
      // Check label
      const label = group.children[0];
      assert.strictEqual(label.tagName, 'text');
      assert.strictEqual(label.textContent, 'Field:');
      assert.strictEqual(label.getAttribute('y'), '45'); // y - 5
      
      // Check foreignObject
      const foreignObject = group.children[1];
      assert.strictEqual(foreignObject.tagName, 'foreignObject');
      assert.strictEqual(foreignObject.getAttribute('width'), '130'); // default width
      
      // Check select element
      const select = foreignObject.children[0];
      assert.strictEqual(select.tagName, 'select');
      assert.strictEqual(select.children.length, 3);
      
      // Check options
      const options = select.children;
      assert.strictEqual(options[0].textContent, 'option1');
      assert.strictEqual(options[1].textContent, 'option2');
      assert.strictEqual(options[1].getAttribute('selected'), 'selected');
      assert.strictEqual(options[2].textContent, 'option3');
    });

    await t.test('should create dropdown without label', () => {
      const group = createUIGroup(10, 50, '', 'value', ['value'], () => {});
      
      // Should only have foreignObject, no label
      assert.strictEqual(group.children.length, 1);
      assert.strictEqual(group.children[0].tagName, 'foreignObject');
    });

    await t.test('should handle custom width', () => {
      const group = createUIGroup(0, 0, 'Test:', 'a', ['a'], () => {}, 200);
      
      const foreignObject = group.children[1];
      assert.strictEqual(foreignObject.getAttribute('width'), '200');
      
      const select = foreignObject.children[0];
      assert.strictEqual(select.style.width, '200px');
    });

    await t.test('should call onChange when selection changes', () => {
      let capturedValue = null;
      const onChange = (value) => { capturedValue = value; };
      
      const group = createUIGroup(0, 0, '', 'old', ['old', 'new'], onChange);
      const select = group.children[0].children[0];
      
      select.dispatchEvent({ type: 'change', target: { value: 'new' } });
      
      assert.strictEqual(capturedValue, 'new');
    });
  });
});
import { useEffect, useRef } from 'react';

function getValueType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return 'function';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  return typeof value;
}

function getDisplayValue(value: unknown): string {
  const type = getValueType(value);
  
  if (type === 'function') {
    const fn = value as { name?: string };
    return `ƒ ${fn.name || 'anonymous'}`;
  }
  if (type === 'array') {
    const arr = value as unknown[];
    return `Array(${arr.length})`;
  }
  if (type === 'object' && value !== null) {
    return `Object {${Object.keys(value as object).length} keys}`;
  }
  if (type === 'string') {
    const str = value as string;
    return str.length > 50 ? `"${str.substring(0, 47)}..."` : `"${str}"`;
  }
  return String(value);
}

export function useWhyDidYouUpdate(name: string, props: Record<string, unknown>) {
  const previousProps = useRef<Record<string, unknown>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changes: Array<{
        property: string;
        type: string;
        from: string;
        to: string;
        changed: string;
      }> = [];

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          const fromType = getValueType(previousProps.current![key]);
          const toType = getValueType(props[key]);
          
          changes.push({
            property: key,
            type: toType,
            from: getDisplayValue(previousProps.current![key]),
            to: getDisplayValue(props[key]),
            changed: fromType === toType ? `${fromType} changed` : `${fromType} → ${toType}`,
          });
        }
      });

      if (changes.length > 0) {
        console.groupCollapsed(
          `%c[why-did-you-update] ${name} %c(${changes.length} ${changes.length === 1 ? 'change' : 'changes'})`,
          'color: #ff9800; font-weight: bold',
          'color: #f44336; font-weight: normal'
        );
        console.table(changes);
        
        // Show detailed breakdown for each change
        changes.forEach(change => {
          if (change.type === 'function') {
            console.log(`%c${change.property}:`, 'color: #2196F3; font-weight: bold', 
              `Function reference changed (new instance created)`);
          } else if (change.type === 'array' || change.type === 'object') {
            console.log(`%c${change.property}:`, 'color: #9C27B0; font-weight: bold', 
              `${change.type} reference changed (could be same values, different reference)`);
          } else {
            console.log(`%c${change.property}:`, 'color: #4CAF50; font-weight: bold', 
              `${change.from} → ${change.to}`);
          }
        });
        
        console.groupEnd();
      }
    }

    previousProps.current = props;
  });
}


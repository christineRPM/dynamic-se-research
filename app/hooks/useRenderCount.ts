import { useRef, useEffect } from 'react';

export function useRenderCount(componentName: string) {
  const renders = useRef(0);
  
  useEffect(() => {
    renders.current += 1;
    console.log(`[${componentName}] Render count:`, renders.current);
  });

  return renders.current;
}



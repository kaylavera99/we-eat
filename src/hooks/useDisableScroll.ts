import { useEffect } from 'react';

const useDisableScroll = (selector: string) => {
  useEffect(() => {
    const ionContent = document.querySelector(selector) as HTMLElement | null;
    if (ionContent) {
      const shadowRoot = (ionContent.shadowRoot as ShadowRoot | null);
      if (shadowRoot) {
        const innerScroll = shadowRoot.querySelector('.scroll-y') as HTMLElement | null;
        if (innerScroll) {
          innerScroll.style.overflowY = 'hidden';
        }
      }
    }
  }, [selector]);
};

export default useDisableScroll;

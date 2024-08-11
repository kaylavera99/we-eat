import { useEffect } from 'react';

const useCustomPadding = (selector: string, paddingTop: string, paddingBottom: string) => {
  useEffect(() => {
    const ionContent = document.querySelector(selector) as HTMLElement | null;
    if (ionContent) {
      const shadowRoot = ionContent.shadowRoot as ShadowRoot | null;
      if (shadowRoot) {
        const innerScroll = shadowRoot.querySelector('.inner-scroll') as HTMLElement | null;
        if (innerScroll) {
          innerScroll.style.paddingTop = paddingTop;
          innerScroll.style.paddingBottom = paddingBottom;
        }
      }
    }
  }, [selector, paddingTop, paddingBottom]);
};

export default useCustomPadding;

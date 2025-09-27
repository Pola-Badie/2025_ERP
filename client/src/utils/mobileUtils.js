export const isMobile = () => {
    return window.innerWidth < 768;
};
export const isTablet = () => {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
};
export const isDesktop = () => {
    return window.innerWidth >= 1024;
};
export const hasTouchSupport = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
export const getDeviceType = () => {
    if (isMobile())
        return 'mobile';
    if (isTablet())
        return 'tablet';
    return 'desktop';
};
export const getOptimalCardColumns = () => {
    if (isMobile())
        return 1;
    if (isTablet())
        return 2;
    return 3;
};
export const getOptimalTablePageSize = () => {
    if (isMobile())
        return 5;
    if (isTablet())
        return 10;
    return 20;
};
export const shouldUseCompactLayout = () => {
    return isMobile();
};
export const getButtonSize = () => {
    if (isMobile())
        return 'default';
    return 'default';
};
export const enableTouchFriendlyFeatures = () => {
    // Add touch-friendly CSS classes
    document.body.classList.add('touch-device');
    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
    // Prevent zoom on input focus (iOS)
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    }
};

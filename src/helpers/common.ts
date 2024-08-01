export const getElementSize = (element: Element & ElementCSSInlineStyle) => {
  element.style.left = '-9999';
  element.style.position = 'absolute';
  document.body.append(element);
  const rect = element.getBoundingClientRect();
  document.body.removeChild(element);
  return rect;
};

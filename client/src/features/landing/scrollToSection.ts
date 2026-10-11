function scrollParent(target: HTMLElement): HTMLElement | null {
  let node = target.parentElement;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    const scrolls = overflowY === 'auto' || overflowY === 'scroll';
    if (scrolls && node.scrollHeight > node.clientHeight + 1) return node;
    node = node.parentElement;
  }
  return null;
}

export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  const header = document.querySelector('header');
  const offset = header?.getBoundingClientRect().height ?? 0;

  if (!target) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const parent = scrollParent(target);
  if (parent) {
    const top =
      target.getBoundingClientRect().top -
      parent.getBoundingClientRect().top +
      parent.scrollTop -
      offset;
    parent.scrollTo({ top, behavior: 'smooth' });
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

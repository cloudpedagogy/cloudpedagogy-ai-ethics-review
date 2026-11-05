import { describe, it, expect } from 'vitest';

/**
 * Pure model of the roving tabindex navigation logic used in FrameworkBuilder.tsx
 */
export function getNextTabIndex(
  currentIndex: number,
  key: string,
  totalTabs: number
): number {
  if (totalTabs <= 0) return -1;
  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % totalTabs;
    case 'ArrowLeft':
      return (currentIndex - 1 + totalTabs) % totalTabs;
    case 'Home':
      return 0;
    case 'End':
      return totalTabs - 1;
    default:
      return -1;
  }
}

/**
 * Pure model of the focus-trap boundary logic used in AppLayout.tsx
 */
export function getFocusTrapTargetIndex(
  currentIndex: number,
  isShiftTab: boolean,
  totalFocusables: number
): number {
  if (totalFocusables <= 0) return -1;
  if (isShiftTab) {
    if (currentIndex === 0) {
      return totalFocusables - 1; // Wrap to last
    }
  } else {
    if (currentIndex === totalFocusables - 1) {
      return 0; // Wrap to first
    }
  }
  return -1; // Standard tab flow
}

describe('Keyboard Accessibility & Focus Management Logic', () => {
  const TABS = ['general', 'criteria', 'thresholds', 'rules', 'safeguards'];

  describe('FrameworkBuilder ARIA Tab Keyboard Navigation', () => {
    it('moves to next tab on ArrowRight with circular wrapping', () => {
      expect(getNextTabIndex(0, 'ArrowRight', TABS.length)).toBe(1);
      expect(getNextTabIndex(3, 'ArrowRight', TABS.length)).toBe(4);
      expect(getNextTabIndex(4, 'ArrowRight', TABS.length)).toBe(0); // wrap to general
    });

    it('moves to previous tab on ArrowLeft with circular wrapping', () => {
      expect(getNextTabIndex(2, 'ArrowLeft', TABS.length)).toBe(1);
      expect(getNextTabIndex(0, 'ArrowLeft', TABS.length)).toBe(4); // wrap to safeguards
    });

    it('jumps directly to first tab on Home key', () => {
      expect(getNextTabIndex(3, 'Home', TABS.length)).toBe(0);
      expect(getNextTabIndex(4, 'Home', TABS.length)).toBe(0);
    });

    it('jumps directly to last tab on End key', () => {
      expect(getNextTabIndex(0, 'End', TABS.length)).toBe(4);
      expect(getNextTabIndex(1, 'End', TABS.length)).toBe(4);
    });

    it('ignores non-navigation keys', () => {
      expect(getNextTabIndex(1, 'Enter', TABS.length)).toBe(-1);
      expect(getNextTabIndex(1, 'Tab', TABS.length)).toBe(-1);
      expect(getNextTabIndex(1, 'Escape', TABS.length)).toBe(-1);
    });

    it('produces correct roving tabindex values', () => {
      const activeTab = 'criteria';
      const tabIndices = TABS.map((t) => (t === activeTab ? 0 : -1));
      expect(tabIndices).toEqual([-1, 0, -1, -1, -1]);
    });
  });

  describe('Mobile Navigation Drawer Focus Trap Logic', () => {
    const focusableCount = 6; // e.g. Close button + 5 NavLinks

    it('wraps focus from last element back to first element on forward Tab', () => {
      const lastIndex = focusableCount - 1;
      expect(getFocusTrapTargetIndex(lastIndex, false, focusableCount)).toBe(0);
    });

    it('wraps focus from first element to last element on Shift+Tab', () => {
      expect(getFocusTrapTargetIndex(0, true, focusableCount)).toBe(focusableCount - 1);
    });

    it('maintains normal DOM tabbing for intermediate elements', () => {
      expect(getFocusTrapTargetIndex(2, false, focusableCount)).toBe(-1);
      expect(getFocusTrapTargetIndex(2, true, focusableCount)).toBe(-1);
    });
  });
});

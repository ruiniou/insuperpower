import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PopoverMenu } from './PopoverMenu';

describe('PopoverMenu multiple', () => {
  it('点选不关闭菜单，行带 aria-checked', () => {
    const onSelect = vi.fn();
    render(<PopoverMenu multiple trigger={<button type="button">Open</button>} onSelect={onSelect}
      items={[{ label: 'A', value: 'a', selected: true }, { label: 'B', value: 'b' }]} />);
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('menuitemcheckbox', { name: 'A' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: 'B' })).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledWith('b', expect.anything());
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });
});

it('shows the reason on hover without activating a disabled action', async () => {
  const onSelect = vi.fn();
  render(<PopoverMenu trigger={<button type="button">Actions</button>} onSelect={onSelect}
    items={[{ label: 'Archive version', disabled: true, disabledReason: 'Referenced by an active Event.' }]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
  const item = screen.getByRole('menuitem', { name: 'Archive version' });
  fireEvent.mouseEnter(item);
  expect(await screen.findByRole('tooltip')).toHaveTextContent('Referenced by an active Event.');
  fireEvent.click(item);
  expect(onSelect).not.toHaveBeenCalled();
  expect(screen.getByRole('menu')).toBeVisible();
});

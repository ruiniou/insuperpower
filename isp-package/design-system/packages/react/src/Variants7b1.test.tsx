import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar/Avatar';
import { Button } from './Button/Button';
import { Card } from './Card/Card';
import { SideBarTabs } from './SideBar/SideBar';

describe('7b-1 钩子', () => {
  it('Button block / shadow=none', () => {
    render(<Button block shadow="none">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('is-block', 'is-flat');
  });
  it('SideBar selectedTone=soft', () => {
    render(<SideBarTabs label="Home" active selectedTone="soft" />);
    expect(screen.getByRole('button')).toHaveClass('is-selected', 'is-soft');
    render(<SideBarTabs label="Def" active />);
    expect(screen.getByRole('button', { name: 'Def' })).not.toHaveClass('is-soft');
  });
  it('Avatar 字号随 size 等比', () => {
    render(<><Avatar name="a" size={24} /><Avatar name="b" size={64} /></>);
    expect(screen.getByLabelText('a').style.fontSize).toBe('11px');
    expect(screen.getByLabelText('b').style.fontSize).toBe('28px');
  });
  it('Card interactive', () => {
    render(<Card interactive>c</Card>);
    expect(screen.getByText('c')).toHaveClass('is-interactive');
  });
});

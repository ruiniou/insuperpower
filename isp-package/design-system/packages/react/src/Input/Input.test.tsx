import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Input } from './Input';
import { Textarea } from '../Textarea/Textarea';
import { Search } from '../Search/Search';

describe('Input / Textarea / Search', () => {
  it('Input：label 关联、必填星号、onChange', () => {
    const onChange = vi.fn();
    render(<Input label="Name" required onChange={onChange} />);
    const el = screen.getByLabelText(/Name/);
    fireEvent.change(el, { target: { value: 'a' } });
    expect(onChange).toHaveBeenCalled();
    expect(document.querySelector('.wiz-field__star')).not.toBeNull();
  });
  it('Input：error 进入错误态，aria-invalid 与 describedby', () => {
    render(<Input label="Name" error="Required" size="large" />);
    const el = screen.getByLabelText('Name');
    expect(el).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
    expect(document.querySelector('.wiz-field--large')).not.toBeNull();
    expect(document.querySelector('.wiz-field__box.is-error')).not.toBeNull();
  });
  it('Input：disabled / state=disable 不可输入', () => {
    render(<Input aria-label="x" state="disable" />);
    expect(screen.getByLabelText('x')).toBeDisabled();
  });
  it('Textarea：multiline 外壳', () => {
    render(<Textarea label="Note" size="small" />);
    expect(document.querySelector('.wiz-field__box--multi')).not.toBeNull();
    expect(screen.getByLabelText('Note').tagName).toBe('TEXTAREA');
  });
  it('Search：Enter 与按钮触发 onSearch', () => {
    const onSearch = vi.fn();
    render(<Search onSearch={onSearch} defaultValue="abc" />);
    fireEvent.keyDown(screen.getByRole('searchbox'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).toHaveBeenCalledTimes(2);
  });
});

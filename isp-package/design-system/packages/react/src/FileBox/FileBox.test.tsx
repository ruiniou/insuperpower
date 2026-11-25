import { fireEvent, render, screen } from '@testing-library/react';
import { FileBox } from './FileBox';

describe('FileBox', () => {
  it('未选择时显示占位；选择后回调文件名并显示', () => {
    const onChange = vi.fn();
    const { rerender } = render(<FileBox accept=".pdf" onChange={onChange} />);
    expect(screen.getByText('No file chosen')).toBeInTheDocument();
    const file = new File(['x'], 'protocol.pdf');
    fireEvent.change(screen.getByTestId('filebox-input'), { target: { files: [file] } });
    expect(onChange).toHaveBeenCalledWith('protocol.pdf', file);
    rerender(<FileBox fileName="protocol.pdf" />);
    expect(screen.getByText('protocol.pdf')).toHaveClass('has-file');
  });
  it('offers an explicit remove action only when a selected file can be removed', () => {
    const onRemove = vi.fn();
    const { rerender } = render(<FileBox onRemove={onRemove} />);
    expect(screen.queryByRole('button', { name: /^remove/i })).not.toBeInTheDocument();
    rerender(<FileBox fileName="protocol.pdf" onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove protocol.pdf' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

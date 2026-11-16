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
});

import { fireEvent, render, screen } from '@testing-library/react';
import { InputsCard, UploadSlots, type InputsGroup } from './InputsCard';

const groups: InputsGroup[] = [
  { label: 'Analysis plan', text: 'SAP v2', badge: 'v3 newer', onOpen: vi.fn(), onChange: vi.fn(), changeLabel: 'Change SAP version' },
  { label: 'CRF', text: 'None pinned' },
];

describe('InputsCard', () => {
  it('折叠态：标题 + 数量 + N newer，不渲染分组', () => {
    render(<InputsCard groups={groups} open={false} onToggle={() => {}} />);
    expect(screen.getByText('1 newer')).toBeInTheDocument();
    expect(screen.queryByText('SAP v2')).toBeNull();
    expect(screen.getByRole('button', { name: /Inputs/ })).toHaveAttribute('aria-expanded', 'false');
  });
  it('展开态：分组、跳转、更换版本；点标题回调', () => {
    const toggle = vi.fn();
    render(<InputsCard groups={groups} open onToggle={toggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'SAP v2' }));
    expect(groups[0].onOpen).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Change SAP version' }));
    expect(groups[0].onChange).toHaveBeenCalled();
    expect(screen.queryByText('1 newer')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Inputs/ }));
    expect(toggle).toHaveBeenCalled();
  });
});

describe('UploadSlots', () => {
  it('空槽位显示上传 aria-label，已有显示数量，点击回调 key', () => {
    const pick = vi.fn();
    render(<UploadSlots slots={[{ key: 'ADaM', label: 'ADaM', count: 2 }, { key: 'SDTM', label: 'SDTM' }]} onPick={pick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Upload another ADaM dataset, 2 uploaded' }));
    expect(pick).toHaveBeenCalledWith('ADaM');
    fireEvent.click(screen.getByRole('button', { name: 'Upload SDTM' }));
    expect(pick).toHaveBeenCalledWith('SDTM');
  });
});

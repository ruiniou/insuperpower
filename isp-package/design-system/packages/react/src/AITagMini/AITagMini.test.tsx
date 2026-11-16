import { render, screen } from '@testing-library/react';
import { AITagMini } from './AITagMini';

it('AITagMini 渲染文字与 code 图标', () => {
  const { container } = render(<AITagMini>Table.1(290-321)</AITagMini>);
  expect(screen.getByText('Table.1(290-321)')).toBeInTheDocument();
  expect(container.querySelector('i.ri-code-line')).not.toBeNull();
});

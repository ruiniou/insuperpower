import { fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../../App';
import { setDuty } from '../../store/role';
import { resetDb } from '../../store/store';
import { closeModal } from '../../store/ui';

it('asks for an upload type only when the Asset list has no specific type filter', () => {
  resetDb();
  closeModal();
  setDuty('Study Admin');
  window.history.replaceState(null, '', '#/study/STU-001/asset');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  const types = screen.getByRole('menu');
  expect(within(types).getByRole('menuitem', { name: 'Protocol' })).toBeVisible();
  fireEvent.click(within(types).getByRole('menuitem', { name: 'SAP' }));
  expect(screen.getByRole('textbox', { name: 'Asset type' })).toHaveValue('SAP');
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  fireEvent.click(screen.getByRole('button', { name: 'Type: All' }));
  fireEvent.click(within(screen.getByRole('menu')).getByRole('menuitem', { name: 'Protocol' }));
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
  expect(screen.getByRole('textbox', { name: 'Asset type' })).toHaveValue('Protocol');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
});

it('locks referenced rows and replaces an unreferenced version through the row menu', () => {
  resetDb();
  closeModal();
  setDuty('Study Admin');
  window.history.replaceState(null, '', '#/study/STU-001/asset');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /More actions for STU-001 SAP v3.0/i }));
  expect(screen.getByRole('menuitem', { name: 'Replace content' })).toHaveAttribute('aria-disabled', 'true');
  fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Upload new version' }), { key: 'Escape' });

  fireEvent.click(screen.getByRole('button', { name: /More actions for STU-001 SAP v1.0/i }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Replace content' }));
  const modal = screen.getByRole('dialog', { name: 'Replace Content' });
  expect(within(modal).getByRole('textbox', { name: 'Version' })).toHaveValue('v1.0');
  expect(within(modal).getByRole('textbox', { name: 'Version' })).toHaveAttribute('readonly');
  fireEvent.change(within(modal).getByTestId('wiz-upload-input'), {
    target: { files: [new File(['replacement'], 'updated-sap.txt')] },
  });
  fireEvent.click(within(modal).getByRole('button', { name: 'Replace' }));
  expect(screen.getAllByText('updated-sap.txt').length).toBeGreaterThan(0);
});

it('explains an active reference and marks an unused version as archived across views', async () => {
  resetDb();
  closeModal();
  setDuty('Study Admin');
  window.history.replaceState(null, '', '#/study/STU-001/asset');
  window.dispatchEvent(new HashChangeEvent('hashchange'));
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /More actions for STU-001 SAP v3.0/i }));
  const blocked = screen.getByRole('menuitem', { name: 'Archive version' });
  expect(blocked).toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(blocked);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  fireEvent.keyDown(blocked, { key: 'Escape' });

  const unused = screen.getByRole('row', { name: /STU-001-SAP-v1.0-sample/ });
  fireEvent.click(within(unused).getByRole('button', { name: /More actions/ }));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Archive version' }));
  const confirmation = screen.getByRole('dialog', { name: 'Archive Version?' });
  fireEvent.click(within(confirmation).getByRole('button', { name: 'Archive version' }));
  const marker = within(unused).getByRole('img', { name: 'Archived' });
  expect(marker).toBeVisible();
  fireEvent.mouseEnter(marker);
  expect(await screen.findByText('Archived', { selector: '[role="tooltip"] *' })).toBeVisible();
  fireEvent.mouseLeave(marker);
  fireEvent.click(unused);
  const drawer = screen.getByRole('complementary', { name: 'Asset version' });
  const versionField = within(drawer).getByText('Version', { exact: true }).nextElementSibling as HTMLElement;
  expect(within(versionField).getByRole('img', { name: 'Archived' })).toBeVisible();
  expect(within(drawer).queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  fireEvent.click(within(drawer).getByText('Version history'));
  expect(within(drawer).getAllByRole('img', { name: 'Archived' })).toHaveLength(2);
  fireEvent.click(within(drawer).getByRole('button', { name: /^v2\.0/ }));
  expect(within(drawer).getByRole('button', { name: /^v1\.0 Archived/ })).toBeVisible();
});

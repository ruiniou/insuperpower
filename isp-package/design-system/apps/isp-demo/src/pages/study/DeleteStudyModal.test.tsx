import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { App } from '../../App';
import { auditOf } from '../../store/audit';
import { setDuty } from '../../store/role';
import { S } from '../../store/selectors';
import { getDb, resetDb } from '../../store/store';
import { createEvent } from '../../store/study';
import { closeModal, openModal } from '../../store/ui';

const sid = 'TMP-001';
const reason = 'Duplicate feasibility study entry.';
const navigate = (hash: string) => {
  window.history.replaceState(null, '', hash);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
};
const begin = () => act(() => openModal({ kind: 'deleteStudy', sid }));
const click = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const fillConfirmation = () => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Enter Study Code to Confirm' }), { target: { value: sid } });
  fireEvent.change(screen.getByRole('textbox', { name: 'Reason for Deletion' }), { target: { value: reason } });
};
const enterPasscode = (value = 'demo') =>
  fireEvent.change(screen.getByLabelText(/Demo Passcode/), { target: { value } });

beforeEach(() => {
  resetDb();
  closeModal();
  setDuty('System Owner');
  navigate(`#/study/${sid}/events`);
});

it('retries an unknown check, blocks new activity at submission and retains input after recheck', () => {
  getDb().studyDeletionSignals = { [sid]: { unavailable: true } };
  render(<App />);
  begin();
  expect(screen.getByText(/dependency check is unavailable/)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Sign and Delete' })).toBeNull();
  getDb().studyDeletionSignals![sid] = {};
  click('Recheck Dependencies');
  expect(screen.getByLabelText(/Demo Passcode/)).toBeVisible();

  fillConfirmation();
  enterPasscode();
  getDb().studyDeletionSignals![sid] = { activeOperations: 1 };
  click('Sign and Delete');
  expect(screen.getByText('1 operation')).toBeVisible();
  expect(S.study(sid)?.lifecycle).toBe('ACTIVE');
  expect(auditOf(sid)).toEqual([]);

  getDb().studyDeletionSignals![sid] = {};
  click('Recheck');
  expect(screen.getByRole('textbox', { name: 'Reason for Deletion' })).toHaveValue(reason);
  click('Keep Study');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(auditOf(sid)).toEqual([]);
});

it('rejects a deleted study and its retained event through the actual routes', async () => {
  const event = createEvent({ sid, scope: 'EXPLORATORY', name: 'Feasibility Analysis', goal: '', reason, refs: {} });
  if (!('id' in event) || !event.id) throw new Error('Expected an exploratory event');
  const eventId = event.id;
  render(<App />);
  begin();
  fillConfirmation();
  enterPasscode();
  click('Sign and Delete');

  expect(await screen.findByRole('searchbox', { name: 'Search studies' })).toBeVisible();
  expect(S.event(eventId)).toBeDefined();
  expect(auditOf(sid)).toHaveLength(1);

  act(() => { navigate(`#/study/${sid}/audit`); });
  const main = within(screen.getByRole('region', { name: 'Main' }));
  expect(main.getByRole('status')).toHaveTextContent('Study not found');
  expect(main.queryByRole('button', { name: 'More' })).toBeNull();

  act(() => { navigate(`#/event/${eventId}/overview`); });
  expect(main.getByRole('status')).toHaveTextContent('Event not found');
  expect(main.queryByRole('tablist')).toBeNull();
});

it('dismisses the signature form when leaving the target workspace', () => {
  render(<App />);
  begin();
  fillConfirmation();
  enterPasscode();
  act(() => { navigate('#/studies'); });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(auditOf(sid)).toEqual([]);
});

it('keeps confirmation input in the same dialog when the signature fails', () => {
  render(<App />);
  begin();
  const dialog = screen.getByRole('dialog', { name: /^Delete / });
  fillConfirmation();
  enterPasscode('incorrect');
  click('Sign and Delete');

  expect(screen.getByRole('dialog', { name: /^Delete / })).toBe(dialog);
  expect(screen.getByText('Enter the demo passcode to sign and delete.')).toBeVisible();
  expect(screen.getByLabelText(/Demo Passcode/)).toHaveValue('');
  expect(screen.getByRole('textbox', { name: 'Reason for Deletion' })).toHaveValue(reason);
  expect(S.study(sid)?.lifecycle).toBe('ACTIVE');
  expect(auditOf(sid)).toEqual([]);
});

it('shows the action for an authorized owner, disables it when archived and hides it from members', () => {
  render(<App />);
  click('More');
  expect(screen.getByRole('menuitem', { name: 'Delete Study' })).toBeEnabled();
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  act(() => {
    S.study(sid)!.lifecycle = 'ARCHIVED';
    setDuty('System Owner');
  });
  click('More');
  expect(screen.getByRole('menuitem', { name: 'Delete Study (Archived)' })).toBeDisabled();
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
  act(() => setDuty('Member'));
  click('More');
  expect(screen.queryByRole('menuitem', { name: /Delete Study/ })).toBeNull();
});


it('offers archive review as the primary action when formal evidence blocks deletion', () => {
  getDb().studyDeletionSignals = { [sid]: { retentionHold: true } };
  render(<App />);
  begin();

  const dialog = within(screen.getByRole('dialog', { name: /Can’t delete/ }));
  expect(dialog.getByText('Retention restriction')).toBeVisible();
  expect(dialog.getByRole('button', { name: 'Recheck' })).toBeVisible();
  expect(dialog.getByText(/Checked at/)).toBeVisible();
  expect(dialog.queryByRole('button', { name: 'Sign and Delete' })).toBeNull();
  click('Archive study');
  expect(screen.getByRole('dialog', { name: /Archive study TMP-001/i })).toBeVisible();
  expect(S.study(sid)?.lifecycle).toBe('ACTIVE');
});

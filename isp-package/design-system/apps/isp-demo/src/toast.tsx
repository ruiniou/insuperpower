import { useEffect } from 'react';
import { useSnackbar } from '@wiz/react';
import { setToastHandler } from './store/store';

/** 把 store 里的 toast(msg) 接到组件库的 Snackbar */
export function ToastBridge() {
  const { show } = useSnackbar();
  useEffect(() => {
    setToastHandler((msg, options) => show({ title: msg, ...options }));
    return () => setToastHandler(() => {});
  }, [show]);
  return null;
}

import { useCallback, useRef, useState } from 'react';

/** 受控 / 非受控统一：传 value 即受控，否则用 defaultValue 内部维护 */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void) {
  const [inner, setInner] = useState<T>(defaultValue);
  const controlled = value !== undefined;
  const ref = useRef(controlled);
  ref.current = controlled;
  const set = useCallback((v: T) => {
    if (!ref.current) setInner(v);
    onChange?.(v);
  }, [onChange]);
  return [controlled ? (value as T) : inner, set] as const;
}

let uid = 0;
export function useUid(prefix = 'wiz') {
  const ref = useRef('');
  if (!ref.current) ref.current = `${prefix}-${++uid}`;
  return ref.current;
}

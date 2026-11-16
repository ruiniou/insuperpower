import { SelectBase, type SelectBaseProps, type SelectOption } from './SelectBase';

export type { SelectOption };

/** Figma Input / Select 393:609（Size × State；Content 由是否选中决定） */
export interface SelectProps extends SelectBaseProps {
  value?: string;
  defaultValue?: string;
  /** (value, option) */
  onChange?: (value: string, option: { value: string; label: string }) => void;
}

export function Select({ value, defaultValue, onChange, ...rest }: SelectProps) {
  return (
    <SelectBase
      {...rest}
      multiple={false}
      value={value}
      defaultValue={defaultValue}
      onChangeAny={(v, o) => { if (o) onChange?.(v as string, o); }}
    />
  );
}

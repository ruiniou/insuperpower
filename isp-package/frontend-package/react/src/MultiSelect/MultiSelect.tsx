import { SelectBase, type SelectBaseProps } from '../Select/SelectBase';

/** Figma Input / Multi Select 1120:1199：已选项以 Chip 展示，可逐个移除 */
export interface MultiSelectProps extends SelectBaseProps {
  value?: string[];
  defaultValue?: string[];
  /** (valuesArray) */
  onChange?: (values: string[]) => void;
}

export function MultiSelect({ value, defaultValue, onChange, ...rest }: MultiSelectProps) {
  return <SelectBase {...rest} multiple value={value} defaultValue={defaultValue} onChangeAny={(v) => onChange?.(v as string[])} />;
}

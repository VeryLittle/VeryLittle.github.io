import { InputNumber, Slider, type InputNumberProps } from 'antd';
import type { FC } from 'react';

type DecimalStepProps = {
  min: number;
  max: number;
  value: number;
  step: number;
  onChange: (value: number) => void;
};

export const DecimalStep: FC<DecimalStepProps> = (props) => {
  const onChange: InputNumberProps['onChange'] = (value) => {
    // biome-ignore lint/suspicious/noGlobalIsNan: <explanation>
    if (isNaN(value as number)) {
      return;
    }
    props.onChange(value as number);
  };

  return (
    <div className="flex gap-4">
      <div className="grow">
        <Slider
          min={props.min}
          max={props.max}
          onChange={onChange}
          value={typeof props.value === 'number' ? props.value : 0}
          step={props.step}
        />
      </div>
      <InputNumber
        className="w-20"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={onChange}
      />
    </div>
  );
};

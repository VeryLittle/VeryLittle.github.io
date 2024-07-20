import { InputNumber, type InputNumberProps, Slider } from 'antd';
import type { FC } from 'react';

type IntegerStepProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
};

export const IntegerStep: FC<IntegerStepProps> = (props) => {
  const onChange: InputNumberProps['onChange'] = (newValue) => {
    props.onChange(newValue as number);
  };

  return (
    <div className="flex gap-4">
      <div className="grow">
        <Slider
          min={props.min}
          max={props.max}
          onChange={onChange}
          value={typeof props.value === 'number' ? props.value : 0}
        />
      </div>
      <InputNumber className="w-20" min={props.min} max={props.max} value={props.value} onChange={onChange} />
    </div>
  );
};

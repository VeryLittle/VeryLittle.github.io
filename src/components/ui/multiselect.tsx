'use client';

import type { ReactNode, PropsWithChildren } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdownMenu';
import { ScrollArea } from './scrollArea';

type MultiselectProps<T> = PropsWithChildren<{
  options: T[];
  value: T[];
  getLabel: (option: T) => ReactNode;
  getValue: (option: T) => string | number;
  onChange: (value: T[]) => void;
}>;

export function Multiselect<T>({
  options,
  value,
  getLabel,
  getValue,
  onChange,
  children,
}: MultiselectProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <ScrollArea className="max-h-96" viewportClassName="max-h-96">
          {options.map((option) => {
            const selected = !!value.find((v) => getValue(option) === getValue(v));
            return (
              <DropdownMenuCheckboxItem
                key={getValue(option)}
                checked={selected}
                onClick={(e) => {
                  e.preventDefault();
                  if (selected) {
                    onChange(value.filter((v) => getValue(option) !== getValue(v)));
                  } else {
                    onChange([...value, option]);
                  }
                }}
              >
                {getLabel(option)}
              </DropdownMenuCheckboxItem>
            );
          })}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

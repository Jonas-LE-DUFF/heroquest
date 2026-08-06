import { Grid, Radio, Select } from "@mui/material";
import { SelectType } from "../../../../POO/types/selectType";
import { ChangeEvent, JSX } from "react";

interface SelectorProps {
  selectedType: SelectType;
  checked: () => boolean;
  title: string;
  baseValue: SelectType;
  renderItems: () => JSX.Element[] | null;
  onRadioChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (newSelectedValue: SelectType) => void;
}

export const Selector = ({
  selectedType,
  checked,
  title,
  baseValue,
  renderItems,
  onRadioChange,
  onSelectChange,
}: SelectorProps) => {
  return (
    <>
      <Grid size={1}>
        <Radio
          checked={selectedType != null && checked()}
          onChange={onRadioChange}
          name="selectedType"
        />
      </Grid>
      <Grid size={3}>
        <h5>{title}</h5>
      </Grid>
      <Grid size={8}>
        <Select
          value={baseValue}
          onChange={(e) => {
            onSelectChange(e.target.value as SelectType);
          }}
        >
          {renderItems()}
        </Select>
      </Grid>
    </>
  );
};

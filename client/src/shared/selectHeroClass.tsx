import { MenuItem } from "@mui/material";
import { getHeroClassIconPath, getHeroClassName } from "./utils";
import { HeroCategory } from "../POO/enums/Categories/HeroCategory";

export function renderHeroClassOptions(
  disabledClasses: Set<HeroCategory | undefined> = new Set()
) {
  return Object.entries(HeroCategory)
    .filter(([key]) => isNaN(Number(key)))
    .map(([, value]) => (
      <MenuItem
        key={value}
        value={value}
        disabled={disabledClasses.has(value as HeroCategory)}
      >
        <div className="selectHeroClass">
          <img
            className="heroFaceimage"
            src={getHeroClassIconPath(value as HeroCategory)}
            alt={"icon" + value}
          ></img>
          {getHeroClassName(Number(value))}
        </div>
      </MenuItem>
    ));
}

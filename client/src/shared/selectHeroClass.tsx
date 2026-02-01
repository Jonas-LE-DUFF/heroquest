import { MenuItem } from "@mui/material";
import { getHeroClassIconPath, getHeroClassName } from "./utils";

export function renderHeroClassOptions(
  disabledClasses: Set<heroClass | undefined> = new Set()
) {
  return Object.entries(heroClass)
    .filter(([key, value]) => isNaN(Number(key)))
    .map(([key, value]) => (
      <MenuItem
        key={value}
        value={value}
        disabled={disabledClasses.has(value as heroClass)}
      >
        <div className="selectHeroClass">
          <img
            className="heroFaceimage"
            src={getHeroClassIconPath(value as heroClass)}
            alt={"icon" + value}
          ></img>
          {getHeroClassName(Number(value))}
        </div>
      </MenuItem>
    ));
}

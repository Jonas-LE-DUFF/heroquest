import { Socket } from "socket.io-client";
import "./Navbar.css";
import {
  getHeroClassIconPath,
  getHeroClassName,
  isHero,
} from "../../shared/utils";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
  Tooltip,
} from "@mui/material";
import { PlayerAsJson } from "../../POO/interfaces/ClassAsJson/Server/PlayerAsJson";
import { MonsterAsJson } from "../../POO/interfaces/ClassAsJson/Unit/MonsterAsJson";
import { HeroAsJson } from "../../POO/interfaces/ClassAsJson/Unit/HeroAsJson";
import { PlayerRole } from "../../POO/enums/PlayerRole";
import { useLocation, useNavigate } from "react-router-dom";
import { getHeroesByPlayerId, getHeroToPlay } from "../../shared/serverUtils";
import magicStaffIcon from "/assets/images/icons/navbar/magic-staff.svg";
import swordsIcon from "/assets/images/icons/navbar/crossed-swords.svg";
import backpackIcon from "/assets/images/icons/navbar/backpack.png";
import drawCardIcon from "/assets/images/icons/navbar/search-treasure.svg";
import lockpicks from "/assets/images/icons/navbar/disarm-traps.svg";
import exitIcon from "/assets/images/icons/navbar/exit.svg";
import React, { Dispatch, SetStateAction, useState } from "react";
import EquipmentsDialogComponent from "../Card/Equipments/EquipmentsDialogComponent";
import { PlayerService } from "../../POO/PlayerService";
import { HeroCategory } from "../../POO/enums/Categories/HeroCategory";
import { renderHeroClassOptions } from "../../shared/selectHeroClass";
import { toast } from "react-toastify";
import { InteractionState } from "../../view/hooks/useBoardTileClickHandlers";
import SearchMenu from "../small_components/SearchMenu";
import { LocationState } from "../../POO/types/LocationType";
import logoImage from "/assets/images/icons/heroquestlogo.png";
import { findEquipmentName } from "../../shared/equipments";
import { GameAsJson } from "../../POO/interfaces/ClassAsJson/Server/GameAsJson";

interface NavbarProps {
  socket: Socket;
  game: GameAsJson;
  statsOpen: boolean;
  selectedUnit: HeroAsJson | MonsterAsJson | null;
  currentlyPlayedHero: HeroAsJson | null;
  setCurrentlyPlayedHero: (arg0: HeroAsJson | null) => void;
  setStatsOpen: (arg0: boolean) => void;
  setSelectedUnit: (arg0: HeroAsJson | MonsterAsJson | null) => void;
  openSpellPage: () => void;
  setInteraction: Dispatch<SetStateAction<InteractionState>>;
  setSelectedWeapon: (weaponId: string | null) => void;
  selectedWeapon: string | null;
}

const Navbar: React.FC<NavbarProps> = ({
  socket,
  game,
  statsOpen,
  selectedUnit,
  setStatsOpen,
  setSelectedUnit,
  openSpellPage,
  currentlyPlayedHero,
  setCurrentlyPlayedHero,
  setInteraction,
  setSelectedWeapon,
  selectedWeapon,
}) => {
  const state = useLocation().state as LocationState;
  const navigate = useNavigate();
  const { playerId } = state;
  const player = game.players.find((p) => p.id === playerId) as PlayerAsJson;
  const role = player?.role;

  const playerName = player?.name || "Unknown Player";

  const [showEquipments, setShowEquipments] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);

  let hero: HeroAsJson | null = null;
  if (role === PlayerRole.HERO) {
    hero = currentlyPlayedHero;
  } else {
    if (selectedUnit && isHero(selectedUnit)) hero = selectedUnit;
  }

  function searchTreasures() {
    socket.emit(
      "check-for-treasures",
      { gameId: game.id, playerId: player.id, heroId: hero?.id },
      (response: {
        success: boolean;
        treasureCardId?: string;
        data?: { message: string };
        error?: string;
      }) => {
        if (!response.success) {
          console.error(
            "Erreur lors de la recherche de trésors : " + response.error,
          );
          toast.error(
            `Erreur lors de la recherche de trésors : ${response.error}`,
          );
        } else {
          if (response?.data?.message) {
            toast.info(response.data?.message);
          }
        }
      },
    );
  }

  function leaveGame() {
    socket.emit(
      "leave-game",
      { gameId: game.id, playerId: player.id },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          if (
            response.error?.includes("Game not found") ||
            response.error?.includes("Partie non trouvée")
          ) {
            void navigate("/");
            return;
          }
          console.error(
            "Erreur lors de la sortie de la partie : " + response.error,
          );
          toast.error(
            `Erreur lors de la sortie de la partie : ${response.error}`,
          );
        } else {
          toast.info("Vous avez quitté la partie.");
          void navigate("/");
        }
      },
    );
  }

  function disarmTrap(): void {
    setInteraction((prev: InteractionState) => ({
      ...prev,
      targeting: { mode: "disarmTrap" },
    }));
  }

  const heroesNotControlledByPlayer = new Set(
    Object.entries(HeroCategory)
      .filter(([key, value]) => {
        const hero = getHeroesByPlayerId(player.id, game)?.find(
          (h) => h.category === value,
        );
        return isNaN(Number(key)) && !hero;
      })
      .map(([, value]) => value as HeroCategory),
  );

  const heroCategoryToPlay = getHeroToPlay(game);
  const isHeroTurn =
    heroCategoryToPlay?.category === hero?.category &&
    game.isMonsterTurn === false;
  const isDeadHeroPlayer = role === PlayerRole.HERO && !hero;

  return (
    <>
      <div className={"navbar" + (isDeadHeroPlayer ? " spectating" : "")}>
        <div className="nav-elem">
          <button>
            <img className="img-nav" src={logoImage} alt="Logo" />
          </button>
        </div>
        {player.role === PlayerRole.HERO && hero?.category && (
          <div className="nav-elem">
            <Tooltip
              title={statsOpen ? "Cacher statistiques" : "Voir statistiques"}
              arrow
            >
              <button
                onClick={() => {
                  setSelectedUnit(hero);
                  setStatsOpen(!statsOpen);
                }}
              >
                <img
                  className="img-nav"
                  src={getHeroClassIconPath(hero.category)}
                  alt={getHeroClassName(hero.category)}
                />
              </button>
            </Tooltip>
          </div>
        )}
        <div className="nav-elem">Partie: {game.name}</div>
        <div className="nav-elem">Votre nom: {playerName}</div>
        {isDeadHeroPlayer && (
          <div className="nav-elem">
            Vous etes elimine, vous restez spectateur.
          </div>
        )}
        <hr style={{ border: "solid 1px black", marginRight: "10px" }} />
        <div className="nav-elem">
          {isHeroTurn
            ? "À toi de jouer !"
            : heroCategoryToPlay?.category
              ? "Au tour de " + getHeroClassName(heroCategoryToPlay?.category)
              : "Tour du Maître du jeu"}
        </div>
        {!isDeadHeroPlayer && (
          <>
            {/*equipment button*/}
            {hero && (
              <>
                <div className="nav-elem">
                  <Tooltip title="Voir mon équipement" arrow>
                    <button
                      onClick={() => {
                        setShowEquipments(!showEquipments);
                      }}
                    >
                      <img
                        src={backpackIcon}
                        alt="Backpack"
                        className="img-nav icon-nav"
                      />
                    </button>
                  </Tooltip>
                </div>
                <Dialog
                  open={showEquipments}
                  onClose={() => setShowEquipments(false)}
                >
                  <EquipmentsDialogComponent socket={socket} hero={hero} />
                </Dialog>
              </>
            )}
            {/*spells button*/}
            {hero?.spells && hero.spells.length > 0 && (
              <div className="nav-elem">
                <Tooltip title="Voir mes sorts" arrow>
                  <button onClick={() => openSpellPage()}>
                    <img
                      src={magicStaffIcon}
                      alt="magicStaff"
                      className="img-nav icon-nav"
                    />
                  </button>
                </Tooltip>
              </div>
            )}
            {/*attack button*/}
            {hero && (
              <div className="nav-elem">
                <Tooltip title="Attaquer" arrow>
                  <button
                    onClick={() => {
                      setInteraction((prev: InteractionState) => ({
                        ...prev,
                        targeting: { mode: "attack" },
                      }));
                    }}
                    disabled={!isHeroTurn}
                  >
                    <img
                      src={swordsIcon}
                      alt="Attack"
                      className="img-nav icon-nav"
                    />
                  </button>
                </Tooltip>
              </div>
            )}
            {/*treasures button*/}
            {hero && role === PlayerRole.GAME_MASTER && (
              <button className={"nav-elem"} onClick={() => searchTreasures()}>
                <Tooltip title="Rechercher des trésors" arrow>
                  <img
                    src={drawCardIcon}
                    alt="Draw Card"
                    className="img-nav icon-nav"
                  />
                </Tooltip>
              </button>
            )}
            {/*search menu*/}
            {role === PlayerRole.HERO && hero && (
              <SearchMenu socket={socket} hero={hero} game={game} />
            )}
            {/*disarm trap button*/}
            {role === PlayerRole.HERO && (
              <button
                className="nav-elem"
                onClick={() => disarmTrap()}
                disabled={!isHeroTurn}
              >
                <Tooltip title="Désarmer un piège" arrow>
                  <img
                    src={lockpicks}
                    alt="Lockpicks"
                    className="img-nav icon-nav"
                  />
                </Tooltip>
              </button>
            )}
            {/*hero class selection */}
            {role === PlayerRole.HERO &&
              heroesNotControlledByPlayer.size < 3 && (
                <div className="nav-elem">
                  <Select
                    labelId="label-hero-class"
                    id="select-hero-class"
                    value={currentlyPlayedHero?.category || ""}
                    onChange={(e) => {
                      const newCategory = e.target.value as HeroCategory;
                      setCurrentlyPlayedHero(
                        PlayerService.getHeroByCategory(
                          game,
                          player.id,
                          newCategory,
                        ),
                      );
                    }}
                    autoWidth
                    sx={{ background: "white" }}
                  >
                    {renderHeroClassOptions(heroesNotControlledByPlayer)}
                  </Select>
                </div>
              )}
            {/*weapon selection */}
            {role === PlayerRole.HERO &&
            hero &&
            hero?.equipment?.weapons.length > 1 ? (
              <div className="nav-elem">
                <Select
                  onChange={(e) => {
                    setSelectedWeapon(e.target.value);
                  }}
                  value={selectedWeapon ?? ""}
                >
                  {hero?.equipment?.weapons?.map((weapon) => {
                    return (
                      <MenuItem key={weapon.id} value={weapon.id}>
                        {findEquipmentName(weapon.name)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </div>
            ) : (
              role === PlayerRole.HERO && (
                <div className="nav-elem">
                  <p>
                    Arme :{" "}
                    {findEquipmentName(
                      selectedWeapon ?? hero?.equipment?.weapons[0]?.name,
                    ) ?? "Aucune arme"}
                  </p>
                </div>
              )
            )}
          </>
        )}
        <button
          className="nav-elem"
          onClick={() => setShowLeaveConfirmation(true)}
        >
          <Tooltip title="Quitter la partie" arrow>
            <img src={exitIcon} alt="Exit" className="img-nav" />
          </Tooltip>
        </button>
        <Dialog
          open={showLeaveConfirmation}
          onClose={() => setShowLeaveConfirmation(false)}
        >
          <DialogTitle>Quitter la partie ?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Cette action vous renverra à l&apos;accueil et vous quitterez la
              partie en cours.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <button
              onClick={() => setShowLeaveConfirmation(false)}
              className="classic-button"
            >
              Annuler
            </button>
            <button
              onClick={() => {
                setShowLeaveConfirmation(false);
                leaveGame();
              }}
              className="warning-button"
            >
              Quitter
            </button>
          </DialogActions>
        </Dialog>
      </div>
    </>
  );
};

export default Navbar;

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  GameState,
  Player,
  PlayerRole,
  Position,
  tileType,
  diceFace,
  Monster,
  Tile,
  Direction,
  heroClass,
  Unit,
  spellElement,
  monsterClass,
} from "../src/shared/type";
import {
  checkOnlyOneGameMaster,
  convertGameStateAsSendableGameState,
  fiveHeroPlayers,
  generateMonsterId,
  getAmountOfDices,
  positionKey,
} from "./shared/util";

import { canMove, getPositionAfterMove } from "./shared/wallFunctions";
import { initializeBoard, initializeWalls } from "./shared/initializator";
import { generateMonster } from "./shared/monsterGenerate";

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  }
);

interface SpecialAuthorizedPlayer {
  playerId: string;
  numberOfDices: number;
  diceType: "red" | "fight";
}

let specialAuthorizedPlayer: SpecialAuthorizedPlayer | undefined = undefined;

app.use(express.static(path.join(__dirname, "../../client/build")));

const games = new Map<string, GameState>();

io.on("connection", (socket) => {
  console.log("Un utilisateur connecté:", socket.id);

  // join game
  socket.on(
    "join-game",
    (data: { gameId: string; playerName: string; role: PlayerRole }) => {
      const { gameId, playerName, role } = data;
      console.log("gameId : ", gameId, "playerName : ", playerName);
      if (!gameId || !playerName) {
        socket.emit("join-error", "Données manquantes");
        return;
      }

      socket.join(gameId);

      const isThereGame: GameState | undefined = games.get(gameId);
      let game: GameState;
      if (!isThereGame) {
        game = {
          id: gameId,
          status: "lobby",
          players: new Map<string, Player>(),
          monsters: new Map<string, Monster>(),
          entityPositions: new Map<string, Position>(),
          positionEntities: new Map<string, string>(),
          board: initializeBoard(),
          currentTurn: socket.id,
          walls: initializeWalls(),
          doors: { horizontal: [], vertical: [] },
          turnOrder: [],
        };
        games.set(gameId, game);
      } else {
        game = isThereGame;
        if (role === "game-master" && game) {
          if (!checkOnlyOneGameMaster(game)) {
            console.error(
              "two game-master isn't possible in a game connection interrupted"
            );
            socket.emit("error", "a game master is already in this game");
            return;
          }
        }
        if (game.players.size >= 5) {
          console.error("game is full of players");
          socket.emit("error", "game is full of players");
          return;
        }
        if (game.status === "playing") {
          console.error("game is already launched you can't join");
          socket.emit("error", "game is already launched");
          return;
        }
        if (fiveHeroPlayers(game, role)) {
          console.error(
            "there's already 4 hero players and there can't be a fifth one"
          );
          socket.emit(
            "error",
            "there's already 4 heros in this game and there can't be a fifth one... please select game master or choose another gameId"
          );
          return;
        }
      }
      const newPlayer: Player = {
        id: socket.id,
        characterName: playerName,
        role: role,
        ready: role === "game-master",
      };
      if (!game) {
        console.error("fatal error : game couldn't be created");
        return;
      }
      game.players.set(socket.id, newPlayer);

      if (role === "game-master") {
        game.turnOrder[4] = socket.id;
      } else {
        if (game.turnOrder[4] === undefined) {
          game.turnOrder.push(socket.id);
          console.debug("just pushing");
        } else {
          for (let i = 0; i < 4; i++) {
            // there's never more than 5 players
            if (game.turnOrder[i] === undefined) {
              game.turnOrder[i] = socket.id;
              console.debug("inserting");
              break;
            }
          }
        }
      }
      console.log("turn order : ", game.turnOrder);

      if (game.turnOrder[0]) {
        game.currentTurn = game.turnOrder[0];
      }

      socket.emit("join-success", {
        playerId: socket.id,
        game: convertGameStateAsSendableGameState(game),
      });

      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });

      console.log(`${playerName} a rejoint la partie ${gameId}`);
    }
  );

  //leave-lobby
  socket.on("leave-lobby", (data: { gameId: string }) => {
    const game = games.get(data.gameId);
    if (!game) return;

    removePlayerFromGame(socket.id, game);

    // we shouldn't have to remove that many informations but just making sure
    io.to(data.gameId).emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
    return;
  });

  // start-game
  socket.on("start-game", (data: { gameId: string }) => {
    console.log("🎯 Demande de démarrage pour la partie:", data.gameId);

    const game = games.get(data.gameId);
    if (!game) {
      console.log("❌ Partie non trouvée");
      socket.emit("error", "Partie non trouvée");
      return;
    }

    const player = game.players.get(socket.id);
    if (!player) {
      console.log("❌ Joueur non trouvé dans la partie");
      socket.emit("error", "Joueur non trouvé");
      return;
    }

    if (player.role !== "game-master") {
      console.log("❌ Seul le maître du jeu peut lancer la partie");
      socket.emit("error", "Seul le maître du jeu peut lancer la partie");
      return;
    }

    if (game.players.size < 1) {
      console.log("❌ Pas assez de joueurs");
      socket.emit("error", "Il faut au moins 1 joueur");
      return;
    }

    console.log("✅ Conditions remplies, lancement de la partie...");

    game.status = "playing";
    let pos: Position = { x: 9, y: 9 };
    for (let player of game.players.values()) {
      if (player.role === "game-master") {
        // no hero to place on the board for this player
      } else {
        const tile: Tile | undefined = game.board[pos.x]?.[pos.y];
        if (!tile) return;
        tile.entityId = player.id;
        tile.type = tileType.hero;
        game.entityPositions.set(player.id, pos);
        game.positionEntities.set(positionKey(pos), player.id);
        pos = { x: pos.x + 1, y: pos.y };
      }
    }
    const firstPlayerId = game.turnOrder.find((elem) => {
      console.log(elem);
      return elem !== undefined;
    });
    if (!firstPlayerId) {
      console.error("no first player could be found");
      return;
    }
    game.currentTurn = firstPlayerId;
    console.log("game turnorder : ", game.turnOrder);
    io.to(data.gameId).emit("game-start", {
      gameState: convertGameStateAsSendableGameState(game),
    });
    console.log("📢 Notification game-start envoyée à tous les joueurs");
    console.log(game.players);
    console.log("list of players : ");
    for (let key of game.players) {
      console.log("", key[1].stats);
    }
  });

  // disconnect
  socket.on("disconnect", () => {
    const gameWithFoundPlayer = new Map<string, GameState>();

    // finding the games in which the player is present (there should be only one)
    games.forEach((gameState: GameState, gameId: string) => {
      if (gameState.players.get(socket.id) !== null)
        gameWithFoundPlayer.set(gameId, gameState);
    });
    const gameId = gameWithFoundPlayer.keys().next().value;
    if (gameId === undefined) {
      console.error("no game with player");
      return;
    }
    const game = games.get(gameId);
    if (!game) return;

    removePlayerFromGame(socket.id, game);

    io.to(gameId).emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
    return;
  });

  // place-element
  socket.on(
    "place-element",
    (data: {
      gameId: string;
      position: Position;
      selectedType: tileType | Direction;
      playerId: string;
      monsterType: monsterClass;
    }) => {
      console.debug("placing element", data);
      const { gameId, position, selectedType, playerId } = data;
      if (selectedType === undefined || selectedType === null) return;
      const gameState = games.get(gameId);
      if (!gameState) {
        console.error("no game found");
        return;
      }
      if (gameState.players.get(playerId)?.role !== "game-master") {
        console.error(
          "you are no game master therefore you can't place pieces on the board"
        );
        return;
      }
      let tile = gameState?.board?.[position.x]?.[position.y];
      if (tile === undefined) {
        console.error("tile undefined in index.ts");
        return;
      }

      if (selectedType === null) {
        console.error("nothing to place");
        return;
      }
      if (typeof selectedType === typeof Direction.UP) {
        let positionSent = position;
        let verticalOrHorizontal: "vertical" | "horizontal" = "horizontal";
        if (selectedType === Direction.UP) {
          positionSent = position;
          verticalOrHorizontal = "horizontal";
        }

        if (selectedType === Direction.DOWN) {
          positionSent = { x: position.x + 1, y: position.y };
          verticalOrHorizontal = "horizontal";
        }

        if (selectedType === Direction.LEFT) {
          positionSent = { x: position.x, y: position.y };
          verticalOrHorizontal = "vertical";
        }
        if (selectedType === Direction.RIGHT) {
          positionSent = { x: position.x, y: position.y + 1 };
          verticalOrHorizontal = "vertical";
        }
        console.log("emitting door placed");
        if (verticalOrHorizontal === "horizontal") {
          const row = gameState.doors.horizontal[positionSent.x] ?? [];
          row[positionSent.y] = true;
          gameState.doors.horizontal[positionSent.x] = row;
        } else if (verticalOrHorizontal === "vertical") {
          const row = gameState.doors.vertical[positionSent.x] ?? [];
          row[positionSent.y] = true;
          gameState.doors.vertical[positionSent.x] = row;
        }
        io.to(gameId).emit("door-placed", {
          position: positionSent,
          verticalOrHorizontal: verticalOrHorizontal,
        });
        return;
      }

      if (tile?.type !== tileType.empty && selectedType !== tileType.empty) {
        console.error("tile is occupied");
        return;
      }

      tile.type = selectedType as tileType;

      if (selectedType === tileType.monster) {
        const newMonsterId = generateMonsterId(gameState);

        gameState.entityPositions.set(newMonsterId, position);
        gameState.positionEntities.set(positionKey(position), newMonsterId);
        const monster = generateMonster(newMonsterId, data.monsterType);
        gameState.monsters.set(newMonsterId, monster);
      }
      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(gameState),
      });
    }
  );

  const sleep = (ms: number) => {
    return new Promise((r) => setTimeout(r, ms));
  };

  // roll-dice
  socket.on(
    "roll-dice",
    async (data: {
      gameId: string;
      playerId: string;
      numberOfDice: number;
    }) => {
      console.log("roll-dice");

      const gameState = games.get(data.gameId);
      let numberOfDices: number | undefined;
      if (!gameState) {
        console.error("game couldn't be found");
        return;
      }
      const playerRole = gameState.players.get(data.playerId)?.role;
      if (!playerRole) {
        console.error("player role couldn't be found");
        return;
      }
      console.log(specialAuthorizedPlayer);

      if (
        specialAuthorizedPlayer &&
        specialAuthorizedPlayer.playerId === data.playerId &&
        specialAuthorizedPlayer.diceType === "fight"
      ) {
        console.log("using special authorized dices");
        numberOfDices = specialAuthorizedPlayer.numberOfDices;
        specialAuthorizedPlayer = undefined;
      } else if (playerRole === "hero") {
        console.log("using dice stats");

        numberOfDices = getAmountOfDices(
          gameState,
          data.playerId,
          "att" //TODO : need to know if we attack or defend !!
        );
      } else {
        console.log("using dice given");

        numberOfDices = data.numberOfDice;
      }
      if (numberOfDices === undefined) {
        console.log("no amount of dice to throw defined");
        return;
      }
      console.log("sending");

      for (let j = 0; j < 15; j++) {
        let results: diceFace[] = [];
        for (let i = 0; i < numberOfDices; i++) {
          const randomNumber = Math.floor(Math.random() * 6 + 1);
          let face: diceFace = diceFace.Hit;
          if (randomNumber === 1) {
            face = diceFace.BlackShield;
          } else if (randomNumber < 3) {
            face = diceFace.WhiteShield;
          } else {
            face = diceFace.Hit;
          }
          results.push(face);
        }
        io.to(data.gameId).emit("dice-update", {
          listResults: results,
          role: playerRole,
        });
        console.log("mini sent");

        await sleep(75);
        results = [];
      }
    }
  );

  //roll-red-dice
  socket.on(
    "roll-red-dice",
    async (data: { gameId: string; currentNumberOfDices: number }) => {
      console.log("roll-red-dice");
      let numberOfDices: number = 2;
      const playerRole = games.get(data.gameId)?.players.get(socket.id)?.role;
      if (
        data.currentNumberOfDices !== undefined &&
        data.currentNumberOfDices > 0 &&
        playerRole === "game-master"
      ) {
        numberOfDices = data.currentNumberOfDices;
      } else if (
        specialAuthorizedPlayer &&
        specialAuthorizedPlayer.playerId === socket.id &&
        specialAuthorizedPlayer.diceType === "red"
      ) {
        numberOfDices = specialAuthorizedPlayer.numberOfDices;
        specialAuthorizedPlayer = undefined;
      }
      const role = games.get(data.gameId)?.players.get(socket.id)?.role;
      if (!role) {
        console.error("no role found for player rolling red dices");
        return;
      }
      for (let j = 0; j < 15; j++) {
        let results: number[] = [];
        for (let i = 0; i < numberOfDices; i++) {
          const randomNumber = Math.floor(Math.random() * 6 + 1);
          results.push(randomNumber);
        }
        io.to(data.gameId).emit("red-dice-update", {
          listResults: results,
          role: role,
        });
        await sleep(75);
        results = [];
      }
    }
  );

  // authorize-special-throw-dices
  socket.on(
    "authorize-special-throw-dices",
    (data: {
      gameId: string;
      numberOfDices: number;
      typeOfDices: "fight" | "red";
      playerClass: heroClass;
    }) => {
      console.log("authorizing special throw dices");
      const { gameId, numberOfDices, typeOfDices, playerClass } = data;
      const game = games.get(gameId);
      if (!game) {
        console.error("game couldn't be found");
        return;
      }
      let playerId: string | undefined;
      let playerName = game.players.keys().next().value;
      while (playerName) {
        if (game.players.get(playerName)?.class === playerClass) {
          playerId = game.players.get(playerName)?.id;
          break;
        }
        playerName = game.players.keys().next().value;
        console.log("searching player for special dice authorization");
      }
      if (!playerId) {
        console.error("player couldn't be found");
        return;
      }
      specialAuthorizedPlayer = {
        playerId,
        numberOfDices,
        diceType: typeOfDices,
      };
      console.log(specialAuthorizedPlayer);

      console.log("emitting special-authorization to player :", playerId);
      socket.to(gameId).emit("special-authorization", {
        playerId,
        amountOfDices: numberOfDices,
        typeOfDices: typeOfDices,
      });
    }
  );

  // move-player-one-step
  socket.on(
    "move-player-one-step",
    (data: { gameId: string; playerId: string; direction: Direction }) => {
      console.debug("move-player-one-step", data);
      const gameState = games.get(data.gameId);
      if (!gameState) {
        console.error("game couldn't be found in move-player-one-step");
        return;
      }
      if (gameState.currentTurn !== data.playerId) {
        console.error("not your turn");
        return;
      }
      const player = gameState.players.get(data.playerId);
      if (!player) {
        console.error("player couldn't be found in move-player-one-step");
        return;
      }
      const position = gameState.entityPositions.get(player.id);
      if (!position) {
        console.error(
          "position of player couldn't be found in move-player-one-step"
        );
        return;
      }

      if (!canMove(gameState, position, data.direction)) {
        console.error(
          "movement isn't valid SHOULD HANDLE THAT SO HERO DOESN4T LOSE HIS ACTION"
        );
        return;
      }
      const newPosition = getPositionAfterMove(position, data.direction);
      if (newPosition === position) {
        console.error(
          "no movement SHOULD HANDLE THAT SO HERO DOESN4T LOSE HIS ACTION"
        );
        return;
      }
      const tile = gameState.board[position.x]?.[position.y];
      const newTile = gameState.board[newPosition.x]?.[newPosition.y];

      if (!tile || !newTile) {
        console.error("tiles not found in board");
        return;
      }

      console.log("movement handled should update");

      // make the hero lose 1 movement point
      newTile.entityId = player.id;
      newTile.type = tileType.hero;
      tile.entityId = undefined;
      tile.type = tileType.empty;
      gameState.entityPositions.set(player.id, newPosition);
      gameState.positionEntities.set(positionKey(newPosition), player.id);
      const oldPositionKey = { x: position.x, y: position.y };
      gameState.positionEntities.delete(positionKey(oldPositionKey));

      io.to(data.gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(gameState),
      });
    }
  );

  //end-turn
  socket.on("end-turn", (data: { gameId: string }) => {
    console.log("end-turn");

    const game = games.get(data.gameId);
    if (!game) return;
    if (game.currentTurn !== socket.id) {
      console.error("can't end turn it's not your turn...");

      return;
    }
    console.log(game.turnOrder);

    let playerFound = false;

    for (let i = 0; i < game.turnOrder.length; i++) {
      let nextPlayer = game.turnOrder[i + 1];
      console.log(i);
      console.log(game.turnOrder[i]);
      console.log(game.currentTurn);
      if (i === 4) {
        //last element of the list going back to first
        nextPlayer = game.turnOrder.find((elem) => {
          return elem !== undefined;
        });
        game.currentTurn = nextPlayer ?? "";
      }
      if (game.turnOrder[i] === game.currentTurn) {
        playerFound = true;
        if (nextPlayer !== undefined) {
          game.currentTurn = nextPlayer;
          break;
        }
      }
      if (playerFound && nextPlayer) {
        console.log("new player found ! : ", nextPlayer);
        game.currentTurn = nextPlayer;
        break;
      }
    }

    io.to(data.gameId).emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
  });

  // choose-character
  socket.on(
    "choose-character",
    (
      data: {
        gameId: string;
        playerId: string;
        heroType: heroClass;
        stats: Unit;
        spells: spellElement[];
        gold?: number;
      },
      callback
    ) => {
      const { gameId, playerId, heroType, stats, spells, gold } = data;
      const game = games.get(gameId);

      if (!game) {
        return callback({ success: false, error: "Game not found." });
      }

      const player = game.players.get(playerId);
      if (!player) {
        return callback({ success: false, error: "Player not found." });
      }

      // Validate stats
      for (const value of Object.values(stats)) {
        if (
          value === null ||
          value === undefined ||
          isNaN(value) ||
          Number(value) < 0
        ) {
          return callback({ success: false, error: "Invalid stats values." });
        }
      }

      // Validate gold
      if (gold === undefined || gold < 0 || isNaN(gold)) {
        return callback({ success: false, error: "Invalid gold value." });
      }

      // Ensure game is in the lobby state
      if (game.status !== "lobby") {
        return callback({
          success: false,
          error: "Cannot change character during the game.",
        });
      }

      // Check if the hero class is already selected
      if (
        Array.from(game.players.values()).some(
          (p) => p.class === heroType && p.id !== playerId
        )
      ) {
        return callback({
          success: false,
          error: "Class already selected by another player.",
        });
      }

      // Validate spells
      for (const spell of spells) {
        if (
          Array.from(game.players.values()).some(
            (p) => p.spells?.includes(spell) && p.id !== playerId
          )
        ) {
          return callback({
            success: false,
            error: `Spell ${spell} already selected by another player.`,
          });
        }
      }

      // Specific validations for Elf and Cleric
      if (heroType === heroClass.Elf && spells.length !== 1) {
        return callback({
          success: false,
          error: "Elf must select exactly one spell.",
        });
      }

      if (heroType === heroClass.Cleric && spells.length !== 3) {
        return callback({
          success: false,
          error: "Cleric must select exactly three spells.",
        });
      }

      // If all validations pass, update the player's class and spells
      player.class = heroType;
      player.spells = spells;
      player.ready = true;
      player.gold = gold;
      player.stats = stats;

      io.to(gameId).emit("game-state-update", {
        gameState: convertGameStateAsSendableGameState(game),
      });
      return callback({
        success: true,
        gameState: convertGameStateAsSendableGameState(game),
      });
    }
  );

  //unselect-character
  socket.on("unselect-character", (data: { gameId: string }) => {
    const { gameId } = data;
    const game = games.get(gameId);
    const player = game?.players.get(socket.id);
    if (!game || !player) return;

    player.class = undefined;
    player.spells = undefined;
    player.ready = false;

    io.to(gameId).emit("game-state-update", {
      gameState: convertGameStateAsSendableGameState(game),
    });
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

function removePlayerFromGame(playerId: string, game: GameState) {
  const player = game.players.get(playerId);
  if (!player) {
    console.log("no player found");
    return;
  }
  if (player.id !== undefined) {
    console.log("removing player because of deconnection");
    game.players.delete(player.id);
  }
  if (game.players.size === 0) {
    console.log("no player connected to game deleting...");
    games.delete(game.id);
  }
  for (let i = 0; i < game.turnOrder.length; i++) {
    if (game.turnOrder[i] == player.id) {
      game.turnOrder[i] = undefined;
    }
  }
  console.log("turn order after deconnection : ", game.turnOrder);

  const pos = game.entityPositions.get(playerId);
  game.entityPositions.delete(playerId);
  if (pos) {
    game.positionEntities.delete(positionKey(pos));
  }
  console.log("Utilisateur déconnecté:", playerId);
}

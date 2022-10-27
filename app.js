const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let database = null;

const initializeDbAndServer = async (request, response) => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerObjectToResponseObject = (DbObject) => {
  return {
    playerId: DbObject.player_id,
    playerName: DbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (DbObject) => {
  return {
    matchId: DbObject.match_id,
    match: DbObject.match,
    year: DbObject.year,
  };
};

const convertPlayerMatchObjectToResponseObject = (DbObject) => {
  return {
    playerMatchId: DbObject.player_match_id,
    playerId: DbObject.player_id,
    matchId: DbObject.match_id,
    score: DbObject.score,
    fours: DbObject.fours,
    sixes: DbObject.sixes,
  };
};
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT * from player_details`;
  const players = await database.all(getAllPlayersQuery);
  response.send(
    players.map((eachPlayer) => convertPlayerObjectToResponseObject(eachPlayer))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = ` SELECT * from player_details WHERE player_id=${playerId}
    `;
  const player = await database.get(getPlayerQuery);
  response.send(convertPlayerObjectToResponseObject(player));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;
  const { playerId } = request.params;
  const updatePlayerQuery = `
    UPDATE player_details SET  player_name='${playerName}';
    WHERE player_id='${playerId}'`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * from match_details
    WHERE match_id=${matchId}`;
  const match = await database.get(getMatchQuery);
  response.send(convertMatchObjectToResponseObject(match));
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesQuery = `
    SELECT * from match_details NATURAL JOIN player_match_score
    WHERE player_id=${playerId}`;
  const matches = await database.all(getMatchesQuery);
  response.send(
    matches.map((eachMatch) => convertMatchObjectToResponseObject(eachMatch))
  );
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT * from player_match_score NATURAL JOIN player_details
    WHERE match_id=${matchId};`;
  const players = await database.all(getPlayersQuery);
  response.send(players);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersStatisticsQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details 
    WHERE player_id=${playerId}`;
  const playerStats = await database.get(getPlayersStatisticsQuery);
  response.send(playerStats);
});
module.exports = app;

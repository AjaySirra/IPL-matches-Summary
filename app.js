const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const convertPlayers = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

let db = null;
const InititializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
InititializeDBandServer();

//GET Player_Details
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT *
        FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray.map((eachPlayer) => convertPlayers(eachPlayer)));
});

//GET Player_Detail
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id=${playerId};`;
  const playerDetail = await db.get(getPlayerQuery);
  response.send(convertPlayers(playerDetail));
});

//PUT player
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name ='${playerName}'
  WHERE
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//GET match_details
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
        SELECT*
        FROM match_details
        WHERE match_id=${matchId}`;
  const matchDetails = await db.get(getMatchQuery);
  response.send(convertMatch(matchDetails));
});

//GET list_of_matches_of_a_player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const matchDetailsQuery = `
        SELECT match_details.match_id,match_details.match,match_details.year
        FROM match_details INNER JOIN
        player_match_score ON match_details.match_id=player_match_score.match_id
        WHERE player_id=${playerId};`;
  const matchesArray = await db.all(matchDetailsQuery);
  response.send(matchesArray.map((eachMatch) => convertMatch(eachMatch)));
});

//GET players_of_a_match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersMatchQuery = `
        SELECT player_details.player_id,player_details.player_name
        FROM player_details INNER JOIN
        player_match_score ON player_details.player_id=player_match_score.player_id
        WHERE match_id=${matchId}`;
  const playerMatchArray = await db.all(playersMatchQuery);
  response.send(
    playerMatchArray.map((playerMatch) => convertPlayers(playerMatch))
  );
});

//GET Stats
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const playerStatsQuery = `
        SELECT player_details.player_id,
        player_details.player_name,
        SUM(score),
        SUM(player_match_score.fours),
        SUM(player_match_score.sixes)
        FROM player_details INNER JOIN player_match_score
        ON player_details.player_id=player_match_score.player_id
        WHERE player_match_score.player_id=${playerId};`;
  const playerStatsArray = await db.get(playerStatsQuery);
  response.send({
    playerId: playerStatsArray["player_id"],
    playerName: playerStatsArray["player_name"],
    totalScore: playerStatsArray["SUM(score)"],
    totalFours: playerStatsArray["SUM(player_match_score.fours)"],
    totalSixes: playerStatsArray["SUM(player_match_score.sixes)"],
  });
});

module.exports = app;

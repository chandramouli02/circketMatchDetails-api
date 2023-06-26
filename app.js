const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

//db initialization..
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server Running in port: 3000");
    });
  } catch (e) {
    console.log(e);
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//table names: player_details player_id, player_name,
//match_details: match_id, match, year
//player_match_score: player_match_id, match_id, score, fours, sixes
//api1 **
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    select player_id as playerId, player_name as playerName
    from player_details;`;
  const dbResponse = await db.all(getPlayersQuery);
  response.send(dbResponse);
});

//api2 get player by id ^
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  //console.log(playerId);
  const getPlayersQuery = `
    select player_id as playerId, player_name as playerName
    from player_details
    where player_id = ${playerId};`;
  const dbResponse = await db.all(getPlayersQuery);
  response.send(dbResponse[0]);
});

//api3 put / update player by id ^
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  console.log(playerId, playerName);
  const getPlayersQuery = `
    update player_details
    set player_id = ${playerId},
        player_name = '${playerName}'
    where player_id = ${playerId};`;
  const dbResponse = await db.run(getPlayersQuery);
  console.log(dbResponse);
  response.send("Player Details Updated");
});

//api4 get matches by matchid ^
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  //console.log(playerId);
  const getMatchById = `
    select match_id as matchId, match, year 
    from match_details
    where match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchById);
  response.send(dbResponse[0]);
});

//api5 get all the matches of a player by playerId ^
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  console.log(playerId);
  const getPlayersMatchesQuery = `
  select m.match_id as matchId, m.match, m.year
  from 
  (player_match_score left join player_details 
  on player_match_score.player_id = player_details.player_id) as T
  natural join match_details as m
  where player_details.player_id = ${playerId};
  `;
  const dbResponse = await db.all(getPlayersMatchesQuery);
  console.log(dbResponse);
  response.send(dbResponse);
});

//api6 get ls of players of a match by matchId ^
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  //console.log(matchId);
  const getMatchById = `
    select pd.player_id as playerId, pd.player_name as playerName
    from 
    player_match_score as pms
    left join player_details as pd
    on pms.player_id = pd.player_id
    where pms.match_id = ${matchId};`;
  const dbResponse = await db.all(getMatchById);
  response.send(dbResponse);
});

//api7 get statistics of a specific player ^
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  //console.log(playerId);
  const getPlayerStatistics = `
  select pd.player_id as playerId, pd.player_name as playerName, sum(pms.score) as totalScore, sum(pms.fours) as totalFours, sum(pms.sixes) as totalSixes
  from 
  player_match_score pms left join player_details pd
  on pms.player_id = pd.player_id
  where pd.player_id = ${playerId};
    `;
  const dbResponse = await db.all(getPlayerStatistics);
  response.send(dbResponse[0]);
});

module.exports = app;

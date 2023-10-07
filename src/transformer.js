/* eslint-disable no-undef */
// 1. takes all logs as input
// 2. fetches all logs
// 2b. get unique steam ids
// 3. get all informations from etf2l api
// 4. create json
const BASE_NUM = 76561197960265728n;
const LOGS_BASE_URL = "http://logs.tf/json";
const ETF2L_BASE_URL = "https://api-v2.etf2l.org";
const LOGS_SEARCH_URL = "http://logs.tf/api/v1";
// GET THIS AUTOMATICALLY LOL KEK
const LOGS_S45 = [
  "3450227",
  "3450264",
  "3454926",
  "3454958",
  "3459276",
  "3459314",
  "3467034",
  "3467065",
  "3476584",
  "3476616",
  "3476684",
  "3482455",
  "3482478",
  "3483196",
  "3483237",
  "3468281",
  "3468305",
  "3476651",
  "3454934",
  "3454952",
  "3459305",
  "3459326",
  "3463227",
  "3463265",
  "3470926",
  "3470960",
  "3472911",
  "3472949",
  "3477210",
  "3477231",
  "3481254",
  "3483016",
  "3483022",
  "3483044",
  "3483069",
  "3450239",
  "3450268",
  "3458011",
  "3458057",
  "3471661",
  "3471701",
  "3471707",
  "3477201",
  "3477229",
  "3482319",
  "3482329",
  "3468296",
  "3468320",
  "3450245",
  "3450252",
  "3450286",
  "3459306",
  "3459341",
  "3468302",
  "3468332",
  "3472915",
  "3472956",
  "3463900",
  "3463938",
  "3477788",
  "3477794",
  "3477810",
  "3466371",
  "3466399",
  "3454943",
  "3454982",
  "3449634",
  "3449674",
  "3449687",
  "3449690",
  "3467653",
  "3467691",
];

const ETF2L_COMPETITIONS = {
  807: "6v6 Season 42 Top Tiers",
  831: "6v6 Autumn 2022: Top Tiers",
  844: "6v6 Winter Showdown 2023: Top Tiers",
  880: "6v6 Summer 2023: Top Tiers",
};

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const getUniqueSteamIDs = (logsStats) => {
  if (logsStats.length === 0) return [];
  // get list of unique steam ids
  const steamIDS = [];
  logsStats.forEach((it) => {
    const ids = Object.keys(it);
    ids.forEach((id) => {
      if (!steamIDS.includes(id)) steamIDS.push(id);
    });
  });
  return steamIDS;
};

const toID64 = (id) => {
  let split = id.split(":");
  let v = BASE_NUM;
  let z = BigInt(split[2]);
  let y = BigInt(split[1]);
  return (v + z * 2n + y).toString();
};

// accepts list of string of logs ids
const fetchLogs = async (logs) => {
  const res = [];
  for (let i = 0; i < logs.length; i++) {
    const data = await fetch(`${LOGS_BASE_URL}/${logs[i]}`);
    const jsonData = await data.json();
    await timer(800);
    res.push(jsonData);
  }
  return res;
};

const getPlayersInfo = async (steamIds) => {
  const res = [];
  for (let i = 0; i < steamIds.length; i++) {
    const etf2lPlayerInfo = await fetch(
      `${ETF2L_BASE_URL}/player/${toID64(steamIds[i])}`
    );
    const player = await etf2lPlayerInfo.json();
    await timer(800);
    res.push({ id: steamIds[i], player });
  }
  return res;
};

const getPlayerAverages = (logs, playersInfo) => {
  const playerStats = [];
};

const getSeasonStats = async () => {
  const logs = fetchLogs(LOGS_S45);
  const uniqueSteamIds = getUniqueSteamIDs(logs);
  const playersInfo = getPlayersInfo(uniqueSteamIds);
  // for each player get the logs stats
};

// returns ALL the prem teams given the competition
const getTeams = async (competitionId) => {
  // get prem & div1 teams based on competition
  const etf2lTeams = await fetch(
    `${ETF2L_BASE_URL}/competition/${competitionId}/teams`
  );
  const data = await etf2lTeams.json();
  const teams = data.teams.data;

  const premTeams = [];

  // only keep prem teams
  for (let i = 0; i < teams.length; i++) {
    const teamData = await fetch(teams[i].url);
    const data = await teamData.json();
    await timer(800);
    const teamStatus = data.team.competitions[competitionId];
    if (teamStatus && teamStatus.division.name === "Premiership") {
      premTeams.push(teams[i]);
    }
  }
  return premTeams;
};

// returns all prem matches from a competition
const getPremMatches = async (competitionId) => {
  const data = await fetch(
    `${ETF2L_BASE_URL}/matches?competition=${competitionId}&division=Premiership`
  );
  const json = await data.json();

  let allMatches = [...json.results.data];

  for (
    let i = json.results.current_page + 1;
    i <= json.results.last_page;
    i++
  ) {
    const data = await fetch(
      `${ETF2L_BASE_URL}/matches?competition=${competitionId}&division=Premiership&page=${i}`
    );
    const json = await data.json();
    allMatches = [...allMatches, json.results.data];
  }
  return allMatches;
};

// cross references logs & api for each match
const getLogsFromMatch = async (matchId) => {
  const etf2lMatch = await fetch(`${ETF2L_BASE_URL}/matches/${matchId}`);
  const match = await etf2lMatch.json();
  const players = match.match.players.filter((item, index, arr) => {
    return index === arr.findIndex((t) => t.name === item.name);
  });

  const maps = match.match.maps;
  const datePlayed = new Date(match.match.time * 1000);

  let ids = "";
  players.forEach((player, index, array) => {
    if (index === array.length - 1) {
      ids += player.steam.id64;
    } else {
      ids += player.steam.id64 + ",";
    }
  });

  // fetch logs
  const logs = await fetch(`${LOGS_SEARCH_URL}/log?player=${ids}`);
  const jsonLogs = await logs.json();

  if (!jsonLogs.logs) {
    console.log(`Could not find any logs for match: ${match.match.id}`);
    return [];
  }

  // TODO fix this as it's not precise enough
  // filter out logs for same day & the correct maps
  const officialLogs = jsonLogs.logs.filter((log) => {
    const logDate = new Date(log.date * 1000);
    return (
      datePlayed.toDateString() === logDate.toDateString() &&
      maps.includes(log.map)
    );
  });

  console.log(`Found ${officialLogs.length} logs for match ${matchId}`);

  // fetch logs
  const logDataForMatch = [];
  for (let i = 0; i < officialLogs.length; i++) {
    const log = await fetch(`${LOGS_BASE_URL}/${officialLogs[i].id}`);
    const jsonLog = await log.json();
    await timer(800);
    logDataForMatch.push(jsonLog);
  }
  return logDataForMatch;
};

const run = async () => {
  const matches = await getPremMatches("880");
  let matchesLogs = [];
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].id !== undefined) {
      const logs = await getLogsFromMatch(matches[i].id);
      await timer(800);
      matchesLogs = [...matchesLogs, ...logs];
    }
  }
  console.log("ALL logs for competition 880", matchesLogs);
};

run();

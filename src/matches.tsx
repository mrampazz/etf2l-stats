import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "react-data-table-component";
import convert from "./converter";

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

type PlayerStats = {
  kills: number;
  assists: number;
  deaths: number;
  killsPerDeath: number;
  killAssistsPerDeath: number;
  damage: number;
  damagePerMinute: number;
  damagePerDeath: number;
  killsPerMinute: number;
  damageTaken: number;
  damageEfficiency: number;
  healsReceived: number;
  cappedPoints: number;
};

const roundStat = (n: number) => Math.round(n * 100) / 100;
const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const Matches: FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [averages, setAverages] = useState<any[]>([]);
  const [filterText, setFilterText] = useState("");

  // const getUniqueSteamIDS = useCallback((stats: any[]) => {
  //   if (stats.length === 0) return [];
  //   // get list of unique steam ids
  //   const steamIDS: string[] = [];
  //   stats.forEach((it) => {
  //     const ids = Object.keys(it);
  //     ids.forEach((id) => {
  //       if (!steamIDS.includes(id)) steamIDS.push(id);
  //     });
  //   });
  //   return steamIDS;
  // }, []);

  const [players, setPlayers] = useState<
    { id: string; name: string; class: string }[]
  >([]);
  // console.log("players", players);

  useEffect(() => {
    const getLogs = async () => {
      // fetch all logs
      const logsS45 = await fetch("/s45_stats.json");
      const json = await logsS45.json();
      const statsFromLogs = json.data;
      const playersFromLogs = json.players;
      // const steamIDS = getUniqueSteamIDS(statsFromLogs);

      // const playersInfo = [];

      // for (let i = 0; i < steamIDS.length; i++) {
      //   const id = steamIDS[i];
      //   const a = convert(id)?.steamID64;
      //   let name = "";
      //   if (a) {
      //     console.log("LOL");
      //     const etf2lName = await fetch(`/player/${a}`);
      //     const res = await etf2lName.json();
      //     await timer(800);
      //     name = res.player.name;
      //   }
      //   playersInfo.push({ id, name });
      // }
      setPlayers(playersFromLogs);
      setStats(statsFromLogs);
    };
    getLogs();
  }, []);

  useEffect(() => {
    const calcAverages = async () => {
      if (stats.length === 0) return;

      const allStats = [];

      for (let i = 0; i < players.length; i++) {
        const player = players[i];
        let playedGamesById = 0;
        const averages = stats.map((stat) => {
          const playerStat = stat[player.id];

          if (playerStat) {
            playedGamesById++;
            const k = (playerStat.kills * 1800) / playerStat.totalTime;
            const a = (playerStat.assists * 1800) / playerStat.totalTime;
            const d = (playerStat.deaths * 1800) / playerStat.totalTime;
            const dmg = (playerStat.dmg * 1800) / playerStat.totalTime;
            const dt = (playerStat.dt * 1800) / playerStat.totalTime;
            const hr = (playerStat.hr * 1800) / playerStat.totalTime;
            const cappedPoints = (playerStat.cpc * 1800) / playerStat.totalTime;
            return {
              k,
              a,
              d,
              dmg,
              dt,
              hr,
              cappedPoints,
            };
          }
        });

        let avgK = 0;
        let avgA = 0;
        let avgD = 0;
        let avgDMG = 0;
        let avgDT = 0;
        let avgHR = 0;
        let avgCPC = 0;
        averages.forEach((it) => {
          if (it) {
            const { k, a, d, dmg, dt, hr, cappedPoints } = it;
            avgK += k;
            avgA += a;
            avgD += d;
            avgDMG += dmg;
            avgDT += dt;
            avgHR += hr;
            avgCPC += cappedPoints;
          }
        });

        const damage = avgDMG / playedGamesById;
        const damageTaken = avgDT / playedGamesById;
        const damagePerMinute = damage / 30;
        const damageEfficiency = damage / damageTaken;
        const kills = avgK / playedGamesById;
        const assists = avgA / playedGamesById;
        const deaths = avgD / playedGamesById;
        const killsPerDeath = kills / deaths;
        const killAssistsPerDeath = (kills + assists) / deaths;
        const cappedPoints = avgCPC / playedGamesById;
        const healsReceived = avgHR / playedGamesById;
        const damagePerDeath = damage / deaths;
        const killsPerMinute = kills / 30;

        allStats.push({
          name: player.name,
          steamID: player.id,
          class: player.class,
          kills,
          assists,
          deaths,
          killsPerDeath,
          killAssistsPerDeath,
          damage,
          damagePerMinute,
          damageTaken,
          damageEfficiency,
          healsReceived,
          cappedPoints,
          damagePerDeath,
          killsPerMinute,
        });
      }
      setAverages(allStats);
    };
    calcAverages();
  }, [stats, players]);

  const filteredAverages = useMemo(() => {
    if (averages.length === 0) return [];
    if (filterText === "") return averages;
    return averages.filter((it) => {
      const names = filterText.toLocaleLowerCase().split(";");
      return names.some((n) => {
        if (n === "") return false;
        return it.name.toLowerCase().includes(n);
      });
    });
  }, [averages, filterText]);

  return (
    <div>
      <h2>Stats for last season</h2>
      {averages.length > 0 && (
        <input
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      )}
      {averages.length > 0 && (
        <DataTable
          data={filteredAverages}
          responsive
          fixedHeader
          striped
          columns={[
            { name: "Name", selector: (row) => row.name, sortable: true },
            { name: "Class", selector: (row) => row.class, sortable: true },
            {
              name: "K",
              selector: (row) => roundStat(row.kills),
              sortable: true,
            },
            {
              name: "A",
              selector: (row) => roundStat(row.assists),
              sortable: true,
            },
            {
              name: "D",
              selector: (row) => roundStat(row.deaths),
              sortable: true,
            },
            {
              name: "KD",
              selector: (row) => roundStat(row.killsPerDeath),
              sortable: true,
            },
            {
              name: "KAD",
              selector: (row) => roundStat(row.killAssistsPerDeath),
              sortable: true,
            },
            {
              name: "DMG",
              selector: (row) => roundStat(row.damage),
              sortable: true,
            },
            {
              name: "DPM",
              selector: (row) => roundStat(row.damagePerMinute),
              sortable: true,
            },
            {
              name: "DT",
              selector: (row) => roundStat(row.damageTaken),
              sortable: true,
            },
            {
              name: "DE",
              selector: (row) => roundStat(row.damageEfficiency),
              sortable: true,
            },
            {
              name: "HR",
              selector: (row) => roundStat(row.healsReceived),
              sortable: true,
            },
            {
              name: "CP",
              selector: (row) => roundStat(row.cappedPoints),
              sortable: true,
            },
            {
              name: "DPD",
              selector: (row) => roundStat(row.damagePerDeath),
              sortable: true,
            },
            {
              name: "KPM",
              selector: (row) => roundStat(row.killsPerMinute),
              sortable: true,
            },
          ]}
        />
      )}
    </div>
  );
};

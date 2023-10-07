const BASE_NUM = 76561197960265728n;
const REGEX_STEAMID64 = /^[0-9]{17}$/;
const REGEX_STEAMID = /^STEAM_[0-5]:[01]:\d+$/;
const REGEX_STEAMID3 = /^\[U:1:[0-9]+\]$/;

const isSteamID64 = (id: any) => {
  if (!id) {
    return false;
  }
  return REGEX_STEAMID64.test(id);
};

const isSteamID = (id: any) => {
  if (!id) {
    return false;
  }
  return REGEX_STEAMID.test(id);
};

const isSteamID3 = (id: any) => {
  if (!id) {
    return false;
  }
  return REGEX_STEAMID3.test(id);
};

const sIDtosID64 = (sID: any) => {
  console.log("Converting steamID to steamID64");
  let split = sID.split(":");
  let v = BASE_NUM;
  let z = BigInt(split[2]);
  let y = BigInt(split[1]);

  //   if (z && y) {
  return (v + z * 2n + y).toString();
  //   } else {
  //     return false;
  //   }
};

const sID64tosID = (id: number) => {
  console.log("Converting steamID64 to steamID");
  let userID = BigInt(id);
  let baseID = BASE_NUM;
  let y = (userID % 2n).toString();
  const diff: bigint = userID - baseID;
  //@ts-ignore
  let z = Math.floor(diff.toString() / 2).toString();
  return `STEAM_0:${y}:${z}`;
};

const sIDtosID3 = (sID: any) => {
  console.log("Converting steamID to steamID3");
  let split = sID.split(":");
  return `[U:1:${parseInt(split[1]) + parseInt(split[2]) * 2}]`;
};

const sID3tosID = (id: any) => {
  var split = id.split(":");
  var last = split[2].substring(0, split[2].length - 1);
  return `STEAM_0:${last % 2}:${Math.floor(last / 2)}`;
};

const fromSteamID = (id: any) => {
  return {
    steamID64: sIDtosID64(id),
    steamID: id,
    steamID3: sIDtosID3(id),
  };
};

const fromSteamID64 = (id: any) => {
  const steamID = sID64tosID(id);
  return {
    steamID64: id,
    steamID: steamID,
    steamID3: sIDtosID3(steamID),
  };
};

const fromSteamID3 = (id: any) => {
  const steamID = sID3tosID(id);
  return {
    steamID64: sIDtosID64(steamID),
    steamID: steamID,
    steamID3: id,
  };
};

const convert = (id: any) => {
  if (isSteamID(id)) return fromSteamID(id);
  if (isSteamID64(id)) return fromSteamID64(id);
  if (isSteamID3(id)) return fromSteamID3(id);
};

export default convert;

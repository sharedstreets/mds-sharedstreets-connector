const path = require("path");
const moment = require("moment");
const rimraf = require("rimraf");
const shst = require("sharedstreets");
const turf = require("@turf/turf");
const summarize = require("./summarize");
const config = require("../config.json");

var argv = require("minimist")(process.argv.slice(2));

const debug = argv.debug;
const day = moment(argv.day, "YYYY-MM-DD");
var days = +argv.days;

const store = path.join(__dirname, "./../data");

const backfill = async function() {
  return new Promise(async (resolve, reject) => {
    const envelope = turf.bboxPolygon(config.boundary).geometry;

    // get graph
    const graphOpts = {
      source: "osm/planet-181224",
      tileHierarchy: 8
    };
    var graph = new shst.Graph(envelope, graphOpts, 'bike');
    await graph.buildGraph();

    while (days--) {
      const current = day.clone().subtract(days, "day");
      console.log("building: ", current.format("YYYY-MM-DD"));
      var matchCache = {};
      await summarize(current.format("YYYY-MM-DD"), shst, graph, matchCache);
    }
    resolve();
  });
};

const clearDir = async function(dir) {
  return new Promise((resolve, reject) => {
    rimraf(dir, () => {
      resolve();
    });
  });
};

backfill()
  .then(() => {
    if (!debug) rimraf.sync(path.join(__dirname, "./../cache"));
    console.log("\ncompleted backfill");
  })
  .catch(err => {
    console.error(err.message);
  });

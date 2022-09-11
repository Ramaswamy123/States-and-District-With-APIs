const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const getAllStatesData = app.get("/states/", async (request, response) => {
  const getAllStatesDataQuery = `
                 SELECT
                    *
                  FROM 
                    state`;
  const getQueryResult = await db.all(getAllStatesDataQuery);
  const dbDataToNormalData = getQueryResult.map((each) => {
    return {
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    };
  });
  response.send(dbDataToNormalData);
});

//GET single state details
const getUniqueStateData = app.get(
  "/states/:stateId/",
  async (request, response) => {
    const { stateId } = request.params;
    const getUniqueStateDataQuery = `
                   SELECT 
                      *
                    FROM
                      state
                    WHERE state_id = ${stateId}`;
    const getStateQueryResult = await db.get(getUniqueStateDataQuery);

    response.send({
      stateId: getStateQueryResult.state_id,
      stateName: getStateQueryResult.state_name,
      population: getStateQueryResult.population,
    });
  }
);

//Post new State Data
const postDistrictData = app.post("/districts/", async (request, response) => {
  const districtData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = districtData;
  const postDistrictDataQuery = `
                 INSERT INTO 
                 district (district_name,state_id,cases,cured,active,deaths)
                 VALUES ("${districtName}",${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postDistrictDataQuery);
  response.send("District Successfully Added");
});

//get single district details
const getUniqueDistrictData = app.get(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const getUniqueDistrictDataQuery = `
                    SELECT 
                       *
                    FROM
                       district
                    WHERE district_id = ${districtId}`;
    const getDistrictQueryResult = await db.get(getUniqueDistrictDataQuery);
    response.send({
      districtId: getDistrictQueryResult.district_id,
      districtName: getDistrictQueryResult.district_name,
      stateId: getDistrictQueryResult.state_id,
      cases: getDistrictQueryResult.cases,
      cured: getDistrictQueryResult.cured,
      active: getDistrictQueryResult.active,
      deaths: getDistrictQueryResult.deaths,
    });
  }
);

//DELETE district data
const deleteUniqueDistrictData = app.delete(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const deleteDistrictDataQuery = `
                DELETE FROM district
                WHERE district_id = ${districtId};`;
    await db.run(deleteDistrictDataQuery);
    response.send("District Removed");
  }
);

//UPDATE district data
const updateUniqueDistrictData = app.put(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const updateDistrictDataQuery = `
                  UPDATE 
                     district 
                  SET 
                    district_name = "${districtName}",
                    state_id = ${stateId},
                    cases = ${cases},
                    cured = ${cured},
                    active = ${active},
                    deaths = ${deaths}
                  WHERE 
                     district_id = ${districtId}`;
    await db.run(updateDistrictDataQuery);
    response.send("District Details Updated");
  }
);

//get specific state statics

const getStateCasesData = app.get(
  "/states/:stateId/stats/",
  async (request, response) => {
    const { stateId } = request.params;
    const getTotalCasesQuery = `
                 SELECT 
                    SUM(cases),
                    SUM(cured),
                    SUM(active),
                    SUM(deaths)
                 FROM
                    district
                 WHERE state_id = ${stateId}`;
    const stats = await db.get(getTotalCasesQuery);
    response.send({
      totalCases: stats["SUM(cases)"],
      totalCured: stats["SUM(cured)"],
      totalActive: stats["SUM(active)"],
      totalDeaths: stats["SUM(deaths)"],
    });
  }
);

//get district details
const getDistrictDetails = app.get(
  "/districts/:districtId/details/",
  async (request, response) => {
    const { districtId } = request.params;
    const getStateNamesQuery = `
                   SELECT 
                      state_name
                   FROM 
                      district
                   NATURAL JOIN 
                      state
                   WHERE 
                      district_id = ${districtId}`;
    const resultQuery = await db.get(getStateNamesQuery);
    response.send({
      stateName: resultQuery.state_name,
    });
  }
);
module.exports = app;

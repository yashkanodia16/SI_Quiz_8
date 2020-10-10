const express = require("express");
const app = express();
const port = 3000;
const mcache = require("memory-cache");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
app.use(bodyParser.json());
const pool = mariadb.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "sample",
  port: 3306,
  connectionLimit: 5,
});

const options = {
  swaggerDefinition: {
    info: {
      title: "Budget API",
      version: "1.0.0",
      description: "Personal Budget API autogenerated by Swagger",
    },
    host: "134.122.16.20:3000",
    basePath: "/",
  },
  apis: ["./server.js"],
};

const specs = swaggerJsdoc(options);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(specs));

var cache = (duration) => {
  return (req, res, next) => {
    let key = "__express__" + req.originalUrl || req.url;
    let cachedBody = mcache.get(key);
    if (cachedBody) {
      res.send(cachedBody);
      return;
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      };
      next();
    }
  };
};

/**
 * @swagger
 * /orders:
 *    get:
 *      description: Return all records from Orders table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of Orders objects
 */
app.get("/orders", cache(10), async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    var query = "select * from orders";
    var rows = await conn.query(query);
    res.setHeader("Content-type", "application-json");
    res.status(200).send(rows);
  } catch (err) {
    throw err;
  } finally {
    if (conn) return conn.end();
  }
});

/**
 * @swagger
 * /foods:
 *    get:
 *      description: Return all records from foods table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of foods objects
 */
app.get("/foods", cache(10), async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    var query = "select * from foods";
    var rows = await conn.query(query);
    res.setHeader("Content-type", "application-json");
    res.status(200).send(rows);
  } catch (err) {
    throw err;
  } finally {
    if (conn) return conn.end();
  }
});

/**
 * @swagger
 * /daysOrder:
 *    get:
 *      description: Return all records from daysOrder table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Object containing array of daysOrder objects
 */
app.get("/daysOrder", cache(10), async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    var query = "select * from daysorder";
    var rows = await conn.query(query);
    res.setHeader("Content-type", "application-json");
    res.status(200).send(rows);
  } catch (err) {
    throw err;
  } finally {
    if (conn) return conn.end();
  }
});

/**
 * @swagger
 * definitions:
 *   Foods:
 *     properties:
 *       ITEM_ID:
 *         type: string
 *       ITEM_NAME:
 *         type: string
 *       ITEM_UNIT:
 *         type: string
 *       COMPANY_ID:
 *         type: string
 */
/**
 * @swagger
 * /foods:
 *    post:
 *      description: add record to foods table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Added data to food table
 *          400:
 *              description: Error
 *      parameters:
 *          - name: Foods
 *            description: foods object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Foods'
 *
 */
app.post(
  "/foods",
  [check("ITEM_NAME", "Name must contain 2 characters").not().isEmpty().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }
    let conn;
    const { ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID } = req.body;
    try {
      conn = await pool.getConnection();
      var query = await pool.query(
        `INSERT INTO foods (ITEM_ID, ITEM_NAME, ITEM_UNIT, COMPANY_ID) VALUES ('${ITEM_ID}', '${ITEM_NAME}', '${ITEM_UNIT}', '${COMPANY_ID}')`
      );
      var rows = await conn.query(query);
      res.setHeader("Content-type", "application/json");
      res.status(200).send(rows);
    } catch (err) {
      throw err;
    } finally {
      if (conn) return conn.end();
    }
  }
);

app.put(
  "/foods/:id",
  [
    check("ITEM_NAME", "Name must contain 2 characters").not().isEmpty().trim(),
    check("ITEM_UNIT", "Unit must contain 2 characters").not().isEmpty().trim(),
    check("COMPANY_ID", "Company Id must contain 2 characters").not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).send(errors);
    }
    let conn;
    try {
      const ID = req.params.id.trim();
      if (ID == "") {
        res.status(400).json({ errors: "Item Id should not be empty" });
      } else {
        const { ITEM_NAME, ITEM_UNIT, COMPANY_ID } = req.body;
        conn = await pool.getConnection();
        var result = await pool.query(
          `UPDATE foods SET ITEM_NAME = '${ITEM_NAME}' WHERE ITEM_ID = '${ID}'`
        );
        if (result.affectedRows == 0) {
          query = `INSERT INTO foods VALUES ('${ID}', '${ITEM_NAME}', '${ITEM_UNIT}', '${COMPANY_ID}')`;
          result = await pool.query(query);
        }
        res.setHeader("Content-type", "application/json");
        res.status(200).send(result);
      }
    } catch (err) {
      throw err;
    } finally {
      if (conn) return conn.end();
    }
  }
);

/**
 * @swagger
 * /company:
 *    patch:
 *      description: Update record to company table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Updated data to company table
 *          404:
 *              description: No record for given ItemId
 *          422:
 *              description: Errors in input object
 *      parameters:
 *          - name: Company
 *            description: company object
 *            in: body
 *            required: true
 *            schema:
 *              $ref: '#/definitions/Company'
 *
 */
app.patch("/Company/:id", async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).send(errors);
  }
  let conn;
  const id = req.params.id;
  const { COMPANY_NAME, COMPANY_CITY } = req.body;
  let rows = 0;
  try {
    conn = await pool.getConnection();
    if (COMPANY_NAME && COMPANY_CITY) {
      const result = await pool.query(
        `UPDATE company SET COMPANY_NAME='${COMPANY_NAME}', COMPANY_CITY='${COMPANY_CITY}' WHERE COMPANY_ID = '${id}'`
      );
      rows = result.affectedRows;
    } else if (COMPANY_NAME) {
      const result = await pool.query(
        `UPDATE company SET COMPANY_NAME='${COMPANY_NAME}' WHERE COMPANY_ID = '${id}'`
      );
      rows = result.affectedRows;
    } else if (COMPANY_CITY) {
      const result = await pool.query(
        `UPDATE company SET COMPANY_CITY='${COMPANY_CITY}' WHERE COMPANY_ID = '${id}'`
      );
      rows = result.affectedRows;
    }
    if (rows == 0) {
      return res.status(404).send("Record not Found");
    }
    return res.status(200).send("Success");
  } catch (error) {
    res.status(500).send("Server Error");
  } finally {
    if (conn) return conn.end();
  }
});

/**
 * @swagger
 * /foods/{id}:
 *    delete:
 *      description: Delete record in Foods table
 *      produces:
 *          - application/json
 *      responses:
 *          200:
 *              description: Successfully deleted record
 *          500:
 *              description: Errors in input object
 *      parameters:
 *          - name: id
 *            in: path
 *            required: true
 *            type: string
 *
 */
app.delete("/foods/:id", async (req, res) => {
  let conn;
  try {
    const ID = req.params.id;
    conn = await pool.getConnection();
    var query = `Delete FROM foods WHERE ITEM_ID = '${ID}'`;
    var rows = await conn.query(query);
    res.setHeader("Content-Type", "application/json");
    if (rows.affectedRows == 0) {
      return res.status(404).send("Record not Found!");
    }
    res.status(200).send(rows);
  } catch (err) {
    res.status(500).send(res);
  } finally {
    if (conn) return conn.end();
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

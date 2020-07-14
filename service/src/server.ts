import * as express from "express";
import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as mongoose from "mongoose";
import { CallDef, ServiceDef, tollServiceDef, tollServiceImpl } from "./services";
import { parse } from "query-string";

export enum StatusErrors {
    ERR_400 = "ERR_BAD_REQUEST",
    ERR_ITEM_404 = "ERR_ITEM_NOT_FOUND",
    ERR_ROUTE_404 = "ERR_ROUTE_NOT_FOUND",
    ERR_500 = "ERR_INTERNAL_SERVER_ERROR",
}

interface Impl {
    [method: string]: (options?: any) => Promise<any>;
}

const app: express.Application = express();

const jsonParser = bodyParser.json();

const PORT = 5000;

let connnectedToDb = false;

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const dbUrl = "mongodb://db/admin";
const dbConfig: mongoose.ConnectionOptions = {
  keepAlive: true,
  auth: {
    user: user!,
    password: pass!,
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

function connectWithRetry() {
    mongoose.connect(dbUrl, dbConfig)
      .then(() => {
        connnectedToDb = true;
        // tslint:disable-next-line: no-console
        console.log("Connected to db");
      }, (err) => {
        // tslint:disable-next-line: no-console
        console.log("Failed to connect to mongo on startup - retrying in 5 sec", err);
        setTimeout(connectWithRetry, 5000);
      });
}

connectWithRetry();

function healthy(): boolean {
    return connnectedToDb;
}

app.use(cors());

app.use(jsonParser);

// API health check
app.get("/healthy", (req, res) => {
    if (healthy()) {
      res.send("OK");
    } else {
      res.writeHead(503);
      res.end("UNHEALTHY");
    }
});

// processApiRequest links the service defs to their implementations and sends a response accordingly
async function processApiRequest(req: express.Request, res: express.Response, callDef: CallDef, impl: Impl, methodName: string): Promise<void> {
    const query = parse(req.originalUrl.slice(req.originalUrl.indexOf("?")));
    const options: any = { ...req.params };
    (callDef.queryParams || []).map((param) => {
        if (param in query) {
            options[param] = query[param];
        }
    });
    (callDef.jsonQueryParams || []).map((param) => {
        if (query && param in query) {
            options[param] = JSON.parse(query[param] as string);
        }
    });
    if (callDef.body) {
        options[callDef.body] = req.body;
    }
    const result = impl[methodName](options);
    const response = await result;
    if (!response) {
        res.setHeader("Content-Type", "application/json");
        res.status(404);
        res.end(JSON.stringify({
            error: {
                name: StatusErrors.ERR_ITEM_404,
                message: `${callDef.name} with id ${req.params.id} is not found`,
                stack: new Error("Item not found").stack,
            },
        }));
    }
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(response));
}

// registerService function will create the routes specified in the service def of the service.
function registerService<S = Impl>(impl: S, def: ServiceDef<S>): void {
    const methods = Object.keys(def);
    methods.forEach((methodName) => {
      const callDef: CallDef = def[methodName as keyof S];
      const httpMethod: string = callDef.method.toLowerCase();
      (app as any)[httpMethod]("/api/v1" + callDef.path, (req: express.Request, res: express.Response) => {
        if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
            res.setHeader("Content-Type", "application/json");
            res.status(400);
            res.end(JSON.stringify({
                error: {
                    name: StatusErrors.ERR_400,
                    message: `Unable to process the request`,
                    stack: new Error("Bad Request").stack,
                },
            }));
        }
        processApiRequest(req, res, callDef, impl as any as Impl, methodName as string)
        .catch((err) => {
            res.status(500);
            res.end(JSON.stringify({
                error: {
                    name: StatusErrors.ERR_500,
                    message: err.message,
                    stack: err.stack
                },
            }));
        });
      });
    });
}

registerService(tollServiceImpl, tollServiceDef);

// Default route for catching all unknown routes and sending an "Route not found" error.
app.get("/*", (req, res) => {
    res.status(404);
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
        error: {
            name: StatusErrors.ERR_ROUTE_404,
            message: `Unable to find route for ${req.path}`,
            stack: new Error("Route not found").stack,
        },
    }));
});

const exportedServer = app.listen(PORT, () => {
    // tslint:disable-next-line: no-console
    console.log(`Server started on port: ${PORT}`);
});

module.exports = {
    app: exportedServer,
    StatusErrors,
};

import { Database } from "arangojs";
import { ARANGO_DATABASE, ARANGO_PASSWORD, ARANGO_URL, ARANGO_USER } from "../env";

export const db: Database = new Database({
  url: ARANGO_URL,
  databaseName: ARANGO_DATABASE,
  auth: { 
    username: ARANGO_USER, 
    password: ARANGO_PASSWORD 
  },
});
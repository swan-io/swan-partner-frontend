import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import fs from "node:fs";
import path from "node:path";

const introspectionQuery = getIntrospectionQuery();

fetch(`${process.env.PARTNER_API_URL}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: introspectionQuery }),
})
  .then(res => res.json())
  .then(res => buildClientSchema(res.data))
  .then(res => printSchema(res))
  .then(schema =>
    fs.writeFileSync(path.join(__dirname, "dist/partner-schema.gql"), schema, "utf-8"),
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

fetch(`${process.env.UNAUTHENTICATED_API_URL}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: introspectionQuery }),
})
  .then(res => res.json())
  .then(res => buildClientSchema(res.data))
  .then(res => printSchema(res))
  .then(schema =>
    fs.writeFileSync(path.join(__dirname, "dist/unauthenticated-schema.gql"), schema, "utf-8"),
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

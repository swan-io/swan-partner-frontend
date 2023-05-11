import { IntrospectionQuery, buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import fs from "node:fs";
import path from "pathe";
import { string, validate } from "valienv";

const introspectionQuery = getIntrospectionQuery();

const env = validate({
  env: process.env,
  validators: {
    PARTNER_API_URL: string,
    UNAUTHENTICATED_API_URL: string,
  },
});

const partnerIntrospection: Promise<IntrospectionQuery> = fetch(`${env.PARTNER_API_URL}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: introspectionQuery }),
})
  .then(res => res.json())
  .then(res => res as unknown as { data: IntrospectionQuery })
  .then(res => res.data)
  .then(value => value);

partnerIntrospection
  .then(res => buildClientSchema(res))
  .then(res => printSchema(res))
  .then(schema =>
    fs.writeFileSync(path.join(__dirname, "dist/partner-schema.gql"), schema, "utf-8"),
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const ignoredObjects = new Set([
  "Query",
  "Mutation",
  "Subscription",
  "__Schema",
  "__Type",
  "__Field",
  "__InputValue",
  "__EnumValue",
  "__Directive",
]);

void partnerIntrospection.then(x => {
  const idLessObjects = x.__schema.types
    .filter(
      item =>
        item.kind === "OBJECT" &&
        !ignoredObjects.has(item.name) &&
        !item.fields.some(field => field.name === "id"),
    )
    .map(item => item.name);
  fs.writeFileSync(
    path.join(__dirname, "dist/partner-idless-objects.json"),
    JSON.stringify(idLessObjects, null, 2) + "\n",
    "utf-8",
  );
});

const unauthenticatedIntrospection: Promise<IntrospectionQuery> = fetch(
  `${env.UNAUTHENTICATED_API_URL}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: introspectionQuery }),
  },
)
  .then(res => res.json())
  .then(res => res as unknown as { data: IntrospectionQuery })
  .then(res => res.data)
  .then(value => value);

unauthenticatedIntrospection
  .then(res => buildClientSchema(res))
  .then(res => printSchema(res))
  .then(schema =>
    fs.writeFileSync(path.join(__dirname, "dist/unauthenticated-schema.gql"), schema, "utf-8"),
  )
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

void unauthenticatedIntrospection.then(x => {
  const idLessObjects = x.__schema.types
    .filter(
      item =>
        item.kind === "OBJECT" &&
        !ignoredObjects.has(item.name) &&
        !item.fields.some(field => field.name === "id"),
    )
    .map(item => item.name);
  fs.writeFileSync(
    path.join(__dirname, "dist/unauthenticated-idless-objects.json"),
    JSON.stringify(idLessObjects, null, 2) + "\n",
    "utf-8",
  );
});

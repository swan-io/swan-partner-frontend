import { IntrospectionQuery, buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import fs from "node:fs";
import path from "pathe";
import { string, validate } from "valienv";

const query = getIntrospectionQuery();

const env = validate({
  env: process.env,
  validators: {
    PARTNER_ADMIN_API_URL: string,
    PARTNER_API_URL: string,
    UNAUTHENTICATED_API_URL: string,
  },
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

const getIntrospection = (name: string, url: string) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then(res => res.json())
    .then(res => res as { data: IntrospectionQuery })
    .then(res => res.data)
    .then(res => {
      const idLessObjects = res.__schema.types
        .filter(
          item =>
            !ignoredObjects.has(item.name) &&
            item.kind === "OBJECT" &&
            !item.fields.some(field => field.name === "id"),
        )
        .map(item => item.name);

      fs.writeFileSync(
        path.join(__dirname, `dist/${name}-idless-objects.json`),
        JSON.stringify(idLessObjects, null, 2) + "\n",
        "utf-8",
      );

      return res;
    })
    .then(res => buildClientSchema(res))
    .then(res => printSchema(res))
    .then(schema =>
      fs.writeFileSync(path.join(__dirname, `dist/${name}-schema.gql`), schema, "utf-8"),
    )
    .catch(err => {
      console.error(err);
      process.exit(1);
    });

// TODO: Enable download once the introspection is allowed in production
void getIntrospection("partner-admin", env.PARTNER_ADMIN_API_URL);
void getIntrospection("partner", env.PARTNER_API_URL);
void getIntrospection("unauthenticated", env.UNAUTHENTICATED_API_URL);

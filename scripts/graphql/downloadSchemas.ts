import { IntrospectionQuery, buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import { execSync } from "node:child_process";
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

const getIntrospection = (name: string, url: string) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  })
    .then(res => res.json())
    .then(res => res as { data: IntrospectionQuery })
    .then(res => res.data)
    .then(res => buildClientSchema(res))
    .then(res => printSchema(res))
    .then(schema =>
      fs.writeFileSync(path.join(__dirname, `dist/${name}-schema.gql`), schema, "utf-8"),
    )
    .catch(err => {
      console.error(err);
      process.exit(1);
    });

void Promise.all([
  getIntrospection("partner-admin", env.PARTNER_ADMIN_API_URL),
  getIntrospection("partner", env.PARTNER_API_URL),
  getIntrospection("unauthenticated", env.UNAUTHENTICATED_API_URL),
]).then(() => {
  execSync(
    `generate-schema-config scripts/graphql/dist/partner-admin-schema.gql scripts/graphql/dist/partner-admin-schema-config.json`,
  );
  execSync(
    `generate-schema-config scripts/graphql/dist/partner-schema.gql scripts/graphql/dist/partner-schema-config.json`,
  );
  execSync(
    `generate-schema-config scripts/graphql/dist/unauthenticated-schema.gql scripts/graphql/dist/unauthenticated-schema-config.json`,
  );
});

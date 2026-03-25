import { IntrospectionQuery, buildClientSchema, getIntrospectionQuery, printSchema } from "graphql";
import fs from "node:fs";
import path from "pathe";

const query = getIntrospectionQuery({
  inputValueDeprecation: true,
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
  getIntrospection("partner-admin", "https://api.master.oina.ws/sandbox-partner-admin/graphql"),
  getIntrospection("partner", "https://api.master.oina.ws/live-partner/graphql"),
  getIntrospection("unauthenticated", "https://api.master.oina.ws/live-unauthenticated/graphql"),
]);

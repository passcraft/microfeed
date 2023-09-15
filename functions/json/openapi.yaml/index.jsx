import OpenAPIYaml from "../../../edge-src/EdgeApiApp/openapi.yaml.html";
import { yaar_VERSION } from "../../../common-src/Version";

const Mustache = require("mustache");

export async function onRequestGet({ request }) {
  const urlObj = new URL(request.url);
  const baseUrl = urlObj.origin;
  const html = Mustache.render(OpenAPIYaml, {
    baseUrl,
    yaarVersion: yaar_VERSION,
  });

  return new Response(html, {
    headers: {
      "content-type": "text/yaml; charset=utf-8",
    },
  });
}

export function onRequestHead() {
  return new Response("ok");
}

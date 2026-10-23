import app from "./server/app";
const port = Number(process.env.PORT ?? 4318);
app.listen(port, "127.0.0.1", () =>
  console.log(
    `Return Relay listening at http://127.0.0.1:${port}; synthetic data; guided mode; real HTTP MCP.`,
  ),
);

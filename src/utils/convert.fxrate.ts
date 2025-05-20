/**
 * Generate fxrate files from yahoo finance json files
 * e.g. https://query1.finance.yahoo.com/v8/finance/chart/CELO-USD?interval=1d&range=10y
 *
 * Run with: npm run convert-fxrate
 */

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const directory = "./data/fxrate";

function convert(filename: string) {
  const str = readFileSync(filename, "utf8");
  const json = JSON.parse(str);

  if (!json.chart) {
    console.log(`${filename} has no chart data`);
    return;
  }

  if (!json.chart?.result[0]?.indicators?.quote[0]?.close) {
    console.log(`${filename} has no close prices`);
    return;
  }

  const timestamps = json.chart.result[0].timestamp;
  const prices = json.chart.result[0].indicators.quote[0].close;
  const data: Record<string, number> = {};

  timestamps.map((timestamp: number, index: number) => {
    const ts = new Date(timestamp * 1000)
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    data[ts] = prices[index];
  });

  writeFileSync(
    filename.replace("fxrate", "usd.fxrate"),
    JSON.stringify(data, null, 2)
  );
}

const files = readdirSync(directory);

files.forEach((file: string) => {
  if (file.endsWith(".fxrate.json")) {
    convert(join(directory, file));
  }
});

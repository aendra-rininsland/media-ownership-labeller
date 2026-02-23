import Papa from "papaparse";
import type { D } from "../types";
import { AtpAgent } from "@atproto/api";
import { slugify } from "../src/util";

const agent = new AtpAgent({ service: "https://bsky.social" });
await agent.login({
  identifier: process.env.ACCOUNT_HANDLE!,
  password: process.env.ACCOUNT_PASSWORD!,
});

const uri =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQY4KHOpjrtxzrhA3zL5_Qfk9zlnhLJCT_CGruX6y-4-OXYdZbdIsmDTDw7VR_9q2KI_G5kgcIdskpD/pub?gid=0&single=true&output=csv";

const uri_descriptions =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQY4KHOpjrtxzrhA3zL5_Qfk9zlnhLJCT_CGruX6y-4-OXYdZbdIsmDTDw7VR_9q2KI_G5kgcIdskpD/pub?gid=1090057833&single=true&output=csv";

const { data = [] }: { data: D[] } = Papa.parse(
  await fetch(uri).then((r) => r.text()),
  { header: true },
);

const {
  data: labelDescriptions = [],
}: { data: { slug: string; description: string }[] } = Papa.parse(
  await fetch(uri_descriptions).then((r) => r.text()),
  { header: true },
);

const labelCategories = new Set(
  data.map((d) => d.manual_entry).filter((d) => d),
);

const counts = [...labelCategories]
  .map((d) => slugify(d))
  .map((d) => ({ d, l: d.length }))
  .sort((a, b) => b.l - a.l);
console.log(counts);
const record = {
  $type: "app.bsky.labeler.service",
  policies: {
    description:
      "Labels the ownership of media orgs on posts linking to news orgs in the Verified News feed",
    labelValues: [...labelCategories].map((d) => slugify(d)),
    labelValueDefinitions: [...labelCategories].map((d) => ({
      blurs: "content",
      locales: [
        {
          lang: "en",
          name: d,
          description: (
            labelDescriptions.find((l) => l.slug === slugify(d))?.description ??
            ""
          ).replace(/\\n/g, `\n`),
        },
      ],
      severity: "inform",
      adultOnly: false,
      identifier: slugify(d),
      defaultSetting: "ignore",
    })),
  },
  createdAt: new Date().toISOString(),
  reasonTypes: [
    // "com.atproto.moderation.defs#reasonOther",
    // "com.atproto.moderation.defs#reasonAppeal",
  ],
  subjectTypes: [],
  subjectCollections: [],
};

const payload = {
  repo: process.env.ACCOUNT_DID!,
  collection: "app.bsky.labeler.service",
  rkey: "self",
  record,
};
console.log(payload);

await agent.com.atproto.repo.putRecord(payload);

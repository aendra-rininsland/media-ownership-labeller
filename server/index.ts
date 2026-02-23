import { LabelerServer } from "@skyware/labeler";
import { Jetstream, CommitType } from "@skyware/jetstream";
import Papa from "papaparse";
import type { D } from "../types";

const uri =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQY4KHOpjrtxzrhA3zL5_Qfk9zlnhLJCT_CGruX6y-4-OXYdZbdIsmDTDw7VR_9q2KI_G5kgcIdskpD/pub?output=csv";

const { data = [] }: { data: D[] } = Papa.parse(
  await fetch(uri).then((r) => r.text()),
  { header: true },
);

// Fast lookup
const domains = data.reduce((a, c) => {
  for (const d of c.additional_domains ?? []) {
    a.set(d, c);
  }

  a.set(c.handle, c);

  return a;
}, new Map());

const server = new LabelerServer({
  //   did: import.meta.env.ACCOUNT_DID,
  //   signingKey: import.meta.env.SIGNING_KEY,
  did: process.env.ACCOUNT_DID!,
  signingKey: process.env.SIGNING_KEY!,
});

const FEED_URI = "https://bsky.app/profile/aendra.com/feed/verified-news";
const CONTRAILS_ENDPOINT = `wss://api.graze.social/app/contrail?feed=${FEED_URI}`;

const jetstream = new Jetstream({
  wantedCollections: ["app.bsky.feed.post"], // omit to receive all collections
  //   endpoint: CONTRAILS_ENDPOINT, // Uncomment to get just the News feed
});

jetstream.start();

jetstream.onCreate("app.bsky.feed.post", async (event) => {
  if (
    event.commit.record.embed &&
    event.commit.record.embed.$type === "app.bsky.embed.external"
  ) {
    const uri = new URL(event.commit.record.embed.external.uri);
    const domain = uri.hostname.split(".").slice(-2).join(".");
    const subject = `at://${event.did}/${event.commit.collection}/${event.commit.rkey}`;
    const hit = domains.get(domain);
    if (hit && hit.label) {
      await server.createLabel({
        /** The label value. */
        val: hit.label,
        /** The subject of the label. If labeling an account, this should be a string beginning with `did:`. */
        uri: subject,
        /** Optionally, a CID specifying the version of `uri` to label. */
        // cid: event.commit.cid,
        /** Whether this label is negating a previous instance of this label applied to the same subject. */
        neg: false,
        /** The DID of the actor who created this label, if different from the labeler. */
        // src?: string | undefined;
        /** The creation date of the label. Must be in ISO 8601 format. */
        cts: new Date().toISOString(),
        /** The expiration date of the label, if any. Must be in ISO 8601 format. */
        // exp?: string | undefined;
      });
      console.info({
        /** The label value. */
        val: hit.label,
        /** The subject of the label. If labeling an account, this should be a string beginning with `did:`. */
        uri: subject,
        /** Optionally, a CID specifying the version of `uri` to label. */
        cid: event.commit.cid,
        /** Whether this label is negating a previous instance of this label applied to the same subject. */
        neg: false,
        /** The DID of the actor who created this label, if different from the labeler. */
        // src?: string | undefined;
        /** The creation date of the label. Must be in ISO 8601 format. */
        cts: new Date().toISOString(),
        /** The expiration date of the label, if any. Must be in ISO 8601 format. */
        // exp?: string | undefined;
      });
    }

    if (hit && !hit.label) {
      console.error(hit);
    }
  }
});

server.start(14831, (error, address) => {
  if (error) {
    console.error(error);
  } else {
    console.log(`Labeler server listening on ${address}`);
  }
});

/** Site footer on every screen; `terms` also titles the /terms page. */
const footer = {
  terms: "Terms and privacy",
  source: "Source code",
  /** Under the /terms title; {date} is a long localized date. */
  termsUpdated: "Last updated {date}",
};

export type Messages = typeof footer;
export default footer;

/** Reporting content: a pre-filled email whose page address `hide` accepts. */

/** Where reports of unlawful content go. */
export const REPORT_EMAIL = "reports@PLACEHOLDER.invalid";

/**
 * The reported page, with `#response=<txHash>:<index>` for a response. Its
 * origin names the network.
 */
export function reportedUrl(
  surveyKey: string,
  response?: { readonly txHash: string; readonly responseIndex: number },
): string {
  const page = `${location.origin}/survey/${encodeURIComponent(surveyKey)}`;
  return response
    ? `${page}#response=${response.txHash}:${response.responseIndex}`
    : page;
}

/**
 * A `mailto:` report about `url`, asking for what EU DSA Article 16(2)
 * requires of a notice. In English, the reviewers' language.
 */
export function reportHref(url: string): string {
  const subject = "Report of unlawful content on Tessera";
  const body = [
    `Content: ${url}`,
    "",
    "Why this content is unlawful (please be specific, and name the law or court order if you can):",
    "",
    "",
    "Your name:",
    "Your email:",
    "",
    "I confirm in good faith that the information in this report is accurate and complete.",
  ].join("\n");
  return `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

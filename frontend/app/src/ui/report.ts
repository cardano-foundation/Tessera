/**
 * Reporting content this website shows: a pre-filled email, read by a person.
 * The backend's `hide` script reads the page address it carries.
 */

/** Where reports of unlawful content go. */
export const REPORT_EMAIL = "reports@PLACEHOLDER.invalid";

/**
 * The address of what is reported: the survey page, and for one of its
 * responses a `#response=<txHash>:<index>` fragment. The address names the
 * network, since each network has its own website.
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
 * A `mailto:` link to {@link REPORT_EMAIL} about `url`, its body asking for
 * what a notice of illegal content must contain under the EU Digital Services
 * Act (Article 16(2)): the reasons, the exact location, the sender's name and
 * email, and a statement of good faith. In English whatever the interface
 * language, since the team reading reports works in English.
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

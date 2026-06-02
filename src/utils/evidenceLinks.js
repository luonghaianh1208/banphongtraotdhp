const ALLOWED_EVIDENCE_HOSTS = ['facebook.com', 'fb.watch', 'thanhdoanhaiphong.gov.vn'];

export const isFacebookEvidenceUrl = (url) => {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_EVIDENCE_HOSTS.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
  } catch {
    return false;
  }
};

export const hasOnlyFacebookEvidenceLinks = (files = []) => (
  files.every((file) => file?.url && isFacebookEvidenceUrl(file.url))
);

import assert from 'node:assert/strict';
import { hasOnlyFacebookEvidenceLinks, isFacebookEvidenceUrl } from './evidenceLinks.js';

assert.equal(isFacebookEvidenceUrl('https://www.facebook.com/share/p/example'), true);
assert.equal(isFacebookEvidenceUrl('https://thanhdoanhaiphong.gov.vn/tin-bai'), true);
assert.equal(isFacebookEvidenceUrl('https://www.tiktok.com/@doan/video/123'), true);
assert.equal(isFacebookEvidenceUrl('https://vm.tiktok.com/ZMexample/'), true);
assert.equal(isFacebookEvidenceUrl('https://example.com/minh-chung'), false);

assert.equal(
  hasOnlyFacebookEvidenceLinks([
    { url: 'https://www.tiktok.com/@doan/video/123' },
    { url: 'https://www.facebook.com/share/p/example' },
  ]),
  true
);

console.log('evidenceLinks tests passed');

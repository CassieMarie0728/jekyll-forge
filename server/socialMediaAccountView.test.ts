import { describe, expect, it } from 'vitest';
import { toPublicSocialMediaAccount } from './socialMediaAccountView';

describe('toPublicSocialMediaAccount', () => {
  it('removes OAuth credentials while preserving safe connected-account metadata', () => {
    expect(
      toPublicSocialMediaAccount({
        id: 1,
        platform: 'twitter',
        username: 'forge',
        accessToken: 'secret-access-token',
        refreshToken: 'secret-refresh-token',
      })
    ).toEqual({ id: 1, platform: 'twitter', username: 'forge' });
  });
});

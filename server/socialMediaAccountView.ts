type CredentialBearingAccount = {
  accessToken: unknown;
  refreshToken: unknown;
};

export function toPublicSocialMediaAccount<T extends CredentialBearingAccount>(account: T) {
  const { accessToken: _accessToken, refreshToken: _refreshToken, ...publicAccount } = account;
  return publicAccount;
}

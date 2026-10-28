/**
 * Resolve release metadata without publishing or contacting a registry.
 * Stable releases use latest; explicit release candidates use next.
 * A branch can be previewed, but publishing requires its exact version tag.
 */
export const releasePlan = ({ version, ref, publish }) => {
  if (
    typeof version !== 'string' ||
    version.trim() !== version ||
    !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-rc\.(0|[1-9]\d*))?$/.test(version)
  ) {
    throw new Error('release version must be X.Y.Z or X.Y.Z-rc.N without leading zeroes');
  }
  if (typeof publish !== 'boolean') throw new TypeError('publish must be a boolean');
  const tag = `v${version}`;
  const expectedRef = `refs/tags/${tag}`;
  if (ref !== expectedRef && (publish || !ref.startsWith('refs/heads/'))) {
    throw new Error(`release requires ${expectedRef}; branches are allowed only for dry runs`);
  }
  return { version, tag, npmTag: version.includes('-rc.') ? 'next' : 'latest' };
};

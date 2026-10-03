import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function rolloutReady(rollout, replicaSet, service, expected, mode) {
  const status = rollout.status || {};
  const hash = status.currentPodHash;
  const image = object => object?.spec?.template?.spec?.containers?.find(c => c.name === 'customer-client-web')?.image;
  if (!hash || image(rollout) !== expected || image(replicaSet) !== expected) return false;
  if (String(status.observedGeneration) !== String(rollout.metadata.generation)) return false;
  if (replicaSet.metadata?.labels?.['rollouts-pod-template-hash'] !== hash) return false;
  if (!(status.updatedReplicas >= (rollout.spec.replicas || 1))) return false;
  if (!(replicaSet.status?.readyReplicas >= (rollout.spec.replicas || 1))) return false;
  const active = status.blueGreen?.activeSelector === hash && service?.spec?.selector?.['rollouts-pod-template-hash'] === hash;
  if (mode === 'active' || status.phase === 'Healthy') return active && status.phase === 'Healthy';
  const analysis = status.blueGreen?.prePromotionAnalysisRunStatus;
  return status.phase === 'Paused' && status.pauseConditions?.some(p => p.reason === 'BlueGreenPause') &&
    status.blueGreen?.previewSelector === hash && analysis?.status === 'Successful' && analysis.name.includes(hash);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mode, expected] = process.argv.slice(2);
  if (!['preview', 'active'].includes(mode) || !expected) throw new Error('Usage: verify-rollout.mjs preview|active IMAGE');
  const name = process.env.ROLLOUT_NAME || 'customer-client-web';
  const namespace = process.env.ROLLOUT_NAMESPACE || 'apps';
  const get = (kind, name) => JSON.parse(execFileSync('kubectl', ['--request-timeout=20s', 'get', kind, name, '-n', namespace, '-o', 'json'], { encoding: 'utf8' }));
  let consecutive = 0;
  for (let i = 0; i < 90; i++) {
    try {
      const rollout = get('rollout', name);
      const hash = rollout.status?.currentPodHash;
      const rs = hash ? get('replicaset', `${name}-${hash}`) : null;
      const service = get('service', name);
      consecutive = rolloutReady(rollout, rs, service, expected, mode) ? consecutive + 1 : 0;
      console.log(`${mode}: phase=${rollout.status?.phase} hash=${hash} verified=${consecutive}/3`);
      if (consecutive >= 3) process.exit(0);
    } catch (error) {
      consecutive = 0;
      console.log(`Waiting for rollout resources: ${error.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  throw new Error(`Timed out verifying ${mode} traffic for ${expected}`);
}

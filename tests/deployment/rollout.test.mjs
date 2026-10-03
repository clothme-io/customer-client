import test from 'node:test';
import assert from 'node:assert/strict';
import { rolloutReady } from '../../scripts/verify-rollout.mjs';
const image = 'registry/web:approved';
function fixture() {
 const template = {spec:{containers:[{name:'customer-client-web',image}]}};
 return [{metadata:{generation:2},spec:{replicas:1,template},status:{observedGeneration:'2',currentPodHash:'new',updatedReplicas:1,phase:'Paused',pauseConditions:[{reason:'BlueGreenPause'}],blueGreen:{previewSelector:'new',activeSelector:'old',prePromotionAnalysisRunStatus:{name:'web-new-pre',status:'Successful'}}}}, {metadata:{labels:{'rollouts-pod-template-hash':'new'}},spec:{template},status:{readyReplicas:1}}, {spec:{selector:{'rollouts-pod-template-hash':'old'}}}];
}
test('accepts observed approved preview only after successful analysis',()=>{
 const f=fixture(); assert.equal(rolloutReady(...f,image,'preview'),true);
 f[0].status.observedGeneration='1'; assert.equal(rolloutReady(...f,image,'preview'),false);
});
test('rejects stale Healthy status and old active service',()=>{
 const f=fixture(); f[0].status.phase='Healthy';
 assert.equal(rolloutReady(...f,image,'preview'),false);
 assert.equal(rolloutReady(...f,image,'active'),false);
 f[0].status.blueGreen.activeSelector='new';
 assert.equal(rolloutReady(...f,image,'active'),false);
 f[2].spec.selector['rollouts-pod-template-hash']='new';
 assert.equal(rolloutReady(...f,image,'active'),true);
});
test('rejects wrong image or old preview analysis',()=>{
 const f=fixture(); assert.equal(rolloutReady(...f,'registry/web:other','preview'),false);
 f[0].status.blueGreen.prePromotionAnalysisRunStatus.name='web-old-pre';
 assert.equal(rolloutReady(...f,image,'preview'),false);
});

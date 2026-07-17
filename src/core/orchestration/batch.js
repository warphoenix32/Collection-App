(() => {
  const DCE = globalThis.DCE;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  async function execute(request, executeSingle) {
    const targets=Array.isArray(request.targets)?request.targets.filter(Boolean):[];
    if(!targets.length) throw new Error('Batch collection requires at least one target.');
    const adapter=DCE.platformRuntime.requireAdapter(), jobId=request.jobId||DCE.sdk.createJobId('batch'), startedAt=Date.now(), originalUrl=location.href, results=[];
    let cancelled=false;
    DCE.logger.info('batch.started',{jobId,targets:targets.length});
    for(let index=0; index<targets.length; index+=1){
      if(DCE.operationController?.isCancellationRequested?.()){cancelled=true;break;}
      const target=targets[index], itemStartedAt=Date.now(); let result=null;
      for(let attempt=0; attempt<=DCE.config.batchItemRetryCount; attempt+=1){
        DCE.logger.info('batch.item.started',{jobId,index,attempt:attempt+1,target});
        try { result=await executeSingle({strategy:'navigate',target,options:request.options},{restoreAfter:false}); }
        catch(error){ result={success:false,error:error.message,restored:false}; }
        if(result?.success) break;
        if(attempt<DCE.config.batchItemRetryCount){ DCE.logger.warn('batch.item.retry',{jobId,index,target,error:result?.error}); await sleep(1500); }
      }
      const summary=DCE.sdk.summarizeResult(target,result,itemStartedAt,Date.now()); results.push(summary);
      DCE.logger[result?.success?'info':'warn']('batch.item.finished',{jobId,index,summary});
      if(DCE.operationController?.isCancellationRequested?.()){cancelled=true;break;}
    }
    if(cancelled){
      for(const target of targets.slice(results.length)) results.push({targetId:DCE.sdk.stableTargetId(target),target,status:'cancelled',messageCount:0,participantCount:0,collectionComplete:false,warnings:['Not started because the operator cancelled the batch.'],error:null,durationMs:0});
    }
    let restored=true; try { if(location.href!==originalUrl) await adapter.navigation.navigate(originalUrl); } catch(error){restored=false;DCE.logger.error('batch.restore.failed',{jobId,error:error.message});}
    const finishedAt=Date.now(), intent=DCE.collectionIntent.normalize(request.options?.intent||'archival'), runtimePolicy=DCE.runtimePolicies.resolve(request.options?.runtimePolicy||{historicalRuntimeMs:request.options?.maxRuntimeMs}); const manifest={schemaName:'collection-platform-batch-manifest',schemaVersion:'1.2.0',jobId,platform:adapter.manifest.platform,adapterId:adapter.manifest.id,adapterVersion:adapter.manifest.version,platformVersion:DCE.config.platformVersion,startedAt:new Date(startedAt).toISOString(),finishedAt:new Date(finishedAt).toISOString(),durationMs:finishedAt-startedAt,originalUrl,restored,cancelled,totals:{targets:results.length,success:results.filter(i=>i.status==='success').length,warning:results.filter(i=>i.status==='warning').length,failed:results.filter(i=>i.status==='failed').length,cancelled:results.filter(i=>i.status==='cancelled').length,messages:results.reduce((s,i)=>s+i.messageCount,0)},results,provenance:{platform:adapter.manifest.platform,adapterVersion:adapter.manifest.version,platformVersion:DCE.config.platformVersion,collectorVersion:DCE.config.extensionVersion,collectionIntent:intent.id,runtimePolicy,collectionTime:{startedAt:new Date(startedAt).toISOString(),finishedAt:new Date(finishedAt).toISOString()},confidence:results.some(i=>['failed','cancelled'].includes(i.status))?'medium':'high',acquisitionMethod:adapter.manifest.provenance?.acquisitionMethod||'adapter',originalSource:originalUrl},diagnostics:DCE.logger.snapshot()};
    DCE.exporter.downloadPayload(JSON.stringify(manifest,null,2),`collection-platform-batch-${jobId}.json`,'application/json'); DCE.logger.info('batch.finished',{jobId,totals:manifest.totals,restored,cancelled}); return {success:!cancelled&&manifest.totals.failed===0,manifest};
  }
  DCE.batch={execute};
})();

'use strict';
(function(){
  const previousRenderAiResult=renderAiResult;

  function enrichOfficial(job,official){
    if(!official)return official;
    const result=job?.result||{};
    const jobDetailed=result.detailed_analysis||{};
    const officialDetailed=official.detailed_analysis||{};
    const detailed={...jobDetailed,...officialDetailed};

    if(!Array.isArray(detailed.c1_deviations)){
      const deviations=Array.isArray(result.c1_deviations)?result.c1_deviations:Array.isArray(jobDetailed.c1_deviations)?jobDetailed.c1_deviations:null;
      if(deviations)detailed.c1_deviations=deviations;
    }
    if(!detailed.c5_check)detailed.c5_check=result.c5_check||jobDetailed.c5_check||null;
    if(!detailed.competency_improvements&&jobDetailed.competency_improvements)detailed.competency_improvements=jobDetailed.competency_improvements;
    if(!detailed.main_strength&&result.main_strength)detailed.main_strength=result.main_strength;
    if(!detailed.next_step&&result.next_step)detailed.next_step=result.next_step;

    return {...official,detailed_analysis:detailed};
  }

  renderAiResult=(id,job,official,usage,row)=>{
    const officialFixed=enrichOfficial(job,official);
    let jobFixed=job;

    if(officialFixed?.total_score!=null&&job?.result){
      jobFixed={...job,result:{...job.result,total_score:officialFixed.total_score}};
    }

    return previousRenderAiResult(id,jobFixed,officialFixed,usage,row);
  };
})();

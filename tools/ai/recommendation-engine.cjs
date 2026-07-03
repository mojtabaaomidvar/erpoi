
const fs=require("fs");

class RecommendationEngine{

load(){

this.architecture=JSON.parse(

fs.readFileSync(

"reports/json/architecture.json",

"utf8"

)

);

}

recommend(){

const rec=[];

const m=this.architecture.metrics;

if(m.typescriptErrors>0){

rec.push({

priority:1,

title:"Fix TypeScript Errors",

reason:`${m.typescriptErrors} errors detected.`,

impact:"High"

});

}

if(m.circularDependencies>0){

rec.push({

priority:1,

title:"Remove Circular Dependencies",

reason:`${m.circularDependencies} circular dependencies.`,

impact:"Critical"

});

}

if(m.unusedFiles>0){

rec.push({

priority:2,

title:"Delete Unused Files",

reason:`${m.unusedFiles} files.`,

impact:"Medium"

});

}

if(m.unusedExports>20){

rec.push({

priority:3,

title:"Remove Unused Exports",

reason:`${m.unusedExports} exports.`,

impact:"Low"

});

}

return rec;

}

save(rec){

fs.writeFileSync(

"reports/json/REFACTOR_PLAN.json",

JSON.stringify(rec,null,4)

);

let md="# ERP Refactor Plan\n\n";

rec.forEach(r=>{

md+=`## ${r.priority}. ${r.title}\n`;

md+=`${r.reason}\n\n`;

md+=`Impact : ${r.impact}\n\n`;

});

fs.writeFileSync(

"reports/AI_REVIEW.md",

md

);

fs.writeFileSync(

"reports/json/AI_REVIEW.json",

JSON.stringify({

generated:new Date(),

recommendations:rec

},null,4)

);

}

run(){

this.load();

const rec=this.recommend();

this.save(rec);

console.log("AI Review Generated");

}

}

new RecommendationEngine().run();


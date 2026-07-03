
const fs=require("fs");

const glob=require("glob");

class FeatureEngine{

constructor(){

this.result=[];

}

scan(){

const dirs=glob.sync("src/features/*");

dirs.forEach(dir=>{

const files=glob.sync(dir+"/**/*.{ts,tsx}");

let components=0;

let hooks=0;

let pages=0;

let imports=0;

let exportsCount=0;

let largest="";

let maxLines=0;

files.forEach(file=>{

const text=fs.readFileSync(file,"utf8");

const lines=text.split(/\r?\n/).length;

if(lines>maxLines){

maxLines=lines;

largest=file;

}

imports+=(text.match(/^import /gm)||[]).length;

exportsCount+=(text.match(/^export /gm)||[]).length;

components+=(text.match(/return\s*\(/g)||[]).length;

hooks+=(text.match(/use[A-Z]/g)||[]).length;

if(file.includes("pages")){

pages++;

}

});

this.result.push({

feature:dir.split("/").pop(),

files:files.length,

components,

hooks,

pages,

imports,

exports:exportsCount,

largestComponent:largest,

largestComponentLines:maxLines,

health:100,

recommendations:[]

});

});

}

score(){

this.result.forEach(f=>{

let score=100;

if(f.files>40)score-=10;

if(f.imports>120)score-=10;

if(f.largestComponentLines>500)score-=20;

if(f.hooks>20)score-=10;

f.health=score;

});

}

recommend(){

this.result.forEach(f=>{

if(f.largestComponentLines>500){

f.recommendations.push(

"Split largest component."

);

}

if(f.imports>120){

f.recommendations.push(

"Reduce imports."

);

}

if(f.files>40){

f.recommendations.push(

"Split feature."

);

}

});

}

save(){

if(!fs.existsSync("reports/feature-analysis")){

fs.mkdirSync(

"reports/feature-analysis",

{recursive:true}

);

}

this.result.forEach(f=>{

fs.writeFileSync(

`reports/feature-analysis/${f.feature}.json`,

JSON.stringify(f,null,4)

);

});

}

run(){

this.scan();

this.score();

this.recommend();

this.save();

console.log("Feature Analysis Done");

}

}

new FeatureEngine().run();


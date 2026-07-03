
const fs=require("fs");

const {Project}=require("ts-morph");

class DependencyEngine{

constructor(){

this.project=new Project({

tsConfigFilePath:"tsconfig.json"

});

this.nodes=[];

this.edges=[];

}

scan(){

const files=this.project.getSourceFiles();

files.forEach(file=>{

const node=file.getFilePath();

this.nodes.push(node);

file.getImportDeclarations().forEach(i=>{

this.edges.push({

from:node,

to:i.getModuleSpecifierValue()

});

});

});

}

save(){

if(!fs.existsSync("reports/graph")){

fs.mkdirSync(

"reports/graph",

{recursive:true}

);

}

fs.writeFileSync(

"reports/graph/dependency-graph.json",

JSON.stringify({

nodes:this.nodes,

edges:this.edges

},null,4)

);

}

run(){

this.scan();

this.save();

console.log("Dependency Graph Created");

}

}

new DependencyEngine().run();


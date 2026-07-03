
const fs=require("fs");

class GraphIntelligence{

load(){

this.graph=JSON.parse(

fs.readFileSync(

"reports/graph/dependency-graph.json",

"utf8"

)

);

}

calculateDegrees(){

const degree={};

this.graph.nodes.forEach(n=>degree[n]=0);

this.graph.edges.forEach(e=>{

degree[e.from]=(degree[e.from]||0)+1;

});

return degree;

}

hotspots(degree){

return Object.entries(degree)

.sort((a,b)=>b[1]-a[1])

.slice(0,20)

.map(x=>({

file:x[0],

degree:x[1]

}));

}

deadNodes(degree){

return Object.entries(degree)

.filter(x=>x[1]==0)

.map(x=>x[0]);

}

godComponents(degree){

return Object.entries(degree)

.filter(x=>x[1]>25)

.map(x=>({

file:x[0],

dependencies:x[1]

}));

}

coupling(degree){

const values=Object.values(degree);

const total=values.reduce((a,b)=>a+b,0);

return{

average:

values.length

?

(total/values.length)

:0,

max:

Math.max(...values)

};

}

save(name,data){

fs.writeFileSync(

`reports/graph/${name}.json`,

JSON.stringify(data,null,4)

);

}

run(){

this.load();

const degree=this.calculateDegrees();

this.save(

"hotspots",

this.hotspots(degree)

);

this.save(

"dead-nodes",

this.deadNodes(degree)

);

this.save(

"god-components",

this.godComponents(degree)

);

this.save(

"coupling",

this.coupling(degree)

);

this.save(

"architecture-health",

{

nodes:this.graph.nodes.length,

edges:this.graph.edges.length,

dead:this.deadNodes(degree).length,

hotspots:this.hotspots(degree).length,

god:this.godComponents(degree).length

}

);

console.log("Graph Intelligence Generated");

}

}

new GraphIntelligence().run();


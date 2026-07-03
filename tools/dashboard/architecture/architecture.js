
async function loadJson(path){

    try{

        const response=await fetch(path);

        if(!response.ok){

            throw new Error(path);

        }

        return await response.json();

    }

    catch(ex){

        console.warn(path,"not found");

        return null;

    }

}

function setValue(id,value){

    const el=document.getElementById(id);

    if(el){

        el.innerText=value;

    }

}

function createCard(title,value,id){

    return `

    <div class="metric-card">

        <div class="metric-title">${title}</div>

        <div class="metric-value" id="${id}">${value}</div>

    </div>

    `;

}

async function loadArchitecture(){

    const architecture=

        await loadJson("../../../reports/json/architecture.json");

    const health=

        await loadJson("../../../reports/graph/architecture-health.json");

    if(!architecture){

        document.getElementById("graph").innerHTML=

        "<h2>No Analyze Results Found</h2>";

        return;

    }

    setValue(

        "architecture-score",

        architecture.score ?? "--"

    );

    const container=document.getElementById("graph");

    container.innerHTML="";

    container.innerHTML+=createCard(

        "Architecture Score",

        architecture.score,

        "score"

    );

    container.innerHTML+=createCard(

        "Health",

        architecture.health,

        "health"

    );

    if(health){

        container.innerHTML+=createCard(

            "Nodes",

            health.nodes,

            "nodes"

        );

        container.innerHTML+=createCard(

            "Edges",

            health.edges,

            "edges"

        );

        container.innerHTML+=createCard(

            "Dead Nodes",

            health.dead,

            "dead"

        );

        container.innerHTML+=createCard(

            "God Components",

            health.god,

            "god"

        );

        container.innerHTML+=createCard(

            "Hotspots",

            health.hotspots,

            "hotspots"

        );

    }

}

window.addEventListener(

    "DOMContentLoaded",

    loadArchitecture

);


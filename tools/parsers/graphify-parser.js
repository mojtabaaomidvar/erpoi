const Base=require("./base-parser");

class GraphifyParser extends Base{

    parse(){

        const json=this.read(
            "reports/json/graphify.json"
        );

        return{

            tool:"graphify",

            nodes:json.nodes?.length??0,

            edges:json.edges?.length??0,

            graph:json

        };

    }

}

module.exports=GraphifyParser;
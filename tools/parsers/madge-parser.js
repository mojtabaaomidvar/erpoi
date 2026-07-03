const Base=require("./base-parser");

class MadgeParser extends Base{

    parse(){

        const json=this.read(
            "reports/json/madge.json"
        );

        return{

            tool:"madge",

            modules:Object.keys(json).length,

            graph:json

        };

    }

}

module.exports=MadgeParser;
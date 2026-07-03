const Base=require("./base-parser");

class KnipParser extends Base{

    parse(){

        const json=this.read(
            "reports/json/knip-report.json"
        );

        return{

            tool:"knip",

            unusedFiles:json.files??[],

            unusedExports:json.exports??[],

            unusedDependencies:json.dependencies??[]

        };

    }

}

module.exports=KnipParser;
const Base=require("./base-parser");

class TSCParser extends Base{

    parse(){

        const json=this.read("reports/json/tsc.json");

        return{

            tool:"tsc",

            success:json.success,

            duration:json.duration_ms,

            errors:json.output.filter(x=>x.includes("error")),

            errorCount:json.output.filter(x=>x.includes("error")).length

        };

    }

}

module.exports=TSCParser;
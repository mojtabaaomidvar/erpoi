const Base=require("./base-parser");

class BuildParser extends Base{

    parse(){

        const json=this.read(
            "reports/json/build.json"
        );

        return{

            tool:"build",

            success:json.success,

            duration:json.duration_ms

        };

    }

}

module.exports=BuildParser;
const Base=require("./base-parser");

class DependencyParser extends Base{

    parse(){

        const json=this.read(
            "reports/json/dependency.json"
        );

        return{

            tool:"dependency",

            modules:json.modules.length,

            dependencies:json.summary.totalDependencies,

            violations:json.summary.violations,

            circulars:json.summary.circular

        };

    }

}

module.exports=DependencyParser;
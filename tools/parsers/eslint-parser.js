const Base=require("./base-parser");

class ESLintParser extends Base{

    parse(){

        const report=this.read(
            "reports/json/eslint-report.json"
        );

        let errors=0;
        let warnings=0;

        report.forEach(file=>{

            file.messages.forEach(msg=>{

                if(msg.severity===2)
                    errors++;

                if(msg.severity===1)
                    warnings++;

            });

        });

        return{

            tool:"eslint",

            files:report.length,

            errors,

            warnings,

            report

        };

    }

}

module.exports=ESLintParser;
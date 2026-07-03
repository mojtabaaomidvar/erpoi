const BaseRule=require("./base-rule");

class TooManyImportsRule extends BaseRule{

    constructor(){

        super("Too Many Imports");

    }

    run(context){

        const issues=[];

        context.data.files.forEach(file=>{

            if(file.imports>25){

                issues.push(

                    this.issue(

                        "warning",

                        "Too many imports",

                        `${file.imports} imports`,

                        file.file

                    )

                );

            }

        });

        return issues;

    }

}

module.exports=TooManyImportsRule;
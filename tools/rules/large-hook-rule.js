const BaseRule=require("./base-rule");

class LargeHookRule extends BaseRule{

    constructor(){

        super("Large Hook");

    }

    run(context){

        const issues=[];

        context.data.files.forEach(file=>{

            if(file.hooks>15){

                issues.push(

                    this.issue(

                        "info",

                        "Many Hooks",

                        `${file.hooks} hooks detected.`,

                        file.file

                    )

                );

            }

        });

        return issues;

    }

}

module.exports=LargeHookRule;
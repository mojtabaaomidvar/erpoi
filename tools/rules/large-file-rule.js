const BaseRule=require("./base-rule");

class LargeFileRule extends BaseRule{

    constructor(){

        super("Large File");

    }

    run(context){

        const issues=[];

        context.data.files.forEach(file=>{

            if(file.lines>500){

                issues.push(

                    this.issue(

                        "warning",

                        "Large File",

                        `${file.file} has ${file.lines} lines.`,

                        file.file

                    )

                );

            }

        });

        return issues;

    }

}

module.exports=LargeFileRule;
const glob=require("glob");

const FileAnalyzer=require("./file-analyzer");

class ProjectAnalyzer{

    constructor(){

        this.fileAnalyzer=new FileAnalyzer();

    }

    analyze(){

        const files=glob.sync("src/**/*.{ts,tsx}");

        return files.map(f=>this.fileAnalyzer.analyze(f));

    }

}

module.exports=ProjectAnalyzer;
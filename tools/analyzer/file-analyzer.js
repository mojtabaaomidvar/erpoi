const fs = require("fs");

class FileAnalyzer {

    analyze(file){

        const text=fs.readFileSync(file,"utf8");

        const lines=text.split(/\r?\n/);

        return{

            file,

            lines:lines.length,

            size:Buffer.byteLength(text),

            imports:(text.match(/^import /gm)||[]).length,

            exports:(text.match(/^export /gm)||[]).length,

            functions:(text.match(/function /g)||[]).length,

            hooks:(text.match(/use[A-Z]/g)||[]).length,

            jsx:(text.match(/<\w+/g)||[]).length

        };

    }

}

module.exports=FileAnalyzer;
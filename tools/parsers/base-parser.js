const fs = require("fs");

class BaseParser {

    read(file){

        return JSON.parse(
            fs.readFileSync(file,"utf8")
        );

    }

    write(file,data){

        fs.writeFileSync(
            file,
            JSON.stringify(data,null,2)
        );

    }

}

module.exports=BaseParser;
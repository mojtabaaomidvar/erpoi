const { getFiles } = require("./file");

function analyzeImports() {

    const result = [];

    for (const file of getFiles()) {

        const imports = file.getImportDeclarations();

        result.push({

            file: file.getFilePath(),

            imports: imports.map(i => ({

                module: i.getModuleSpecifierValue(),

                named: i.getNamedImports().map(x => x.getName())

            }))

        });

    }

    return result;

}

module.exports = {
    analyzeImports
};

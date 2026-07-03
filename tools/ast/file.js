const project = require("./project");

function getFiles() {
    return project.getSourceFiles();
}

module.exports = {
    getFiles
};

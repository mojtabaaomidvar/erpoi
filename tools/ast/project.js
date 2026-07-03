const { Project } = require("ts-morph");

const project = new Project({
    tsConfigFilePath: "./tsconfig.json"
});

module.exports = project;

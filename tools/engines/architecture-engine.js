const fs = require("fs");

const rules = require("../rules");

const parsers = require("../parsers");
const ProjectAnalyzer=require("../analyzers/project-analyzer");

class ArchitectureEngine {

    constructor() {

        this.data = {};
	this.project=new ProjectAnalyzer();
        this.metrics = {};

    }

runRules() {

    const issues = [];

    for (const rule of rules) {

        issues.push(...rule.run({

            metrics: this.metrics,

            data: this.data

        }));

    }

    this.issues = issues;

}

    load() {

        this.data.build = parsers.build.parse();
	this.data.files=this.project.analyze();
        this.data.tsc = parsers.tsc.parse();

        this.data.eslint = parsers.eslint.parse();

        this.data.knip = parsers.knip.parse();

        this.data.dependency = parsers.dependency.parse();

        this.data.graphify = parsers.graphify.parse();

        this.data.madge = parsers.madge.parse();

    }

    calculate() {

        this.metrics.modules =
            this.data.graphify.nodes;

        this.metrics.dependencies =
            this.data.graphify.edges;

        this.metrics.eslintErrors =
            this.data.eslint.errors;

        this.metrics.eslintWarnings =
            this.data.eslint.warnings;

        this.metrics.typescriptErrors =
            this.data.tsc.errorCount;

        this.metrics.unusedFiles =
            this.data.knip.unusedFiles.length;

        this.metrics.unusedExports =
            this.data.knip.unusedExports.length;

        this.metrics.circularDependencies =
            this.data.dependency.circulars;

        this.metrics.architectureViolations =
            this.data.dependency.violations;

    }

    architectureScore() {

        let score = 100;

        score -= this.metrics.typescriptErrors * 5;

        score -= this.metrics.eslintErrors;

        score -= this.metrics.circularDependencies * 4;

        score -= this.metrics.architectureViolations * 2;

        score -= this.metrics.unusedFiles;

        score -= Math.floor(
            this.metrics.unusedExports / 5
        );

        if(score<0)
            score=0;

        return score;

    }

    healthLevel(score){

        if(score>=95)
            return "Excellent";

        if(score>=85)
            return "Good";

        if(score>=70)
            return "Fair";

        if(score>=50)
            return "Poor";

        return "Critical";

    }

    generate() {

        const score = this.architectureScore();

        const report = {

            generatedAt:
                new Date().toISOString(),

            score,

            health:
                this.healthLevel(score),

            metrics:
                this.metrics,

	    issues: 
		this.issues,

        };

        fs.writeFileSync(

            "reports/json/architecture.json",

            JSON.stringify(report,null,4)

        );

        return report;

    }

    run(){

        this.load();

        this.calculate();
	
	this.runRules();

        return this.generate();

    }

}

module.exports = ArchitectureEngine;
const BaseRule = require("./base-rule");

class CircularRule extends BaseRule {

    constructor() {
        super("Circular Dependency");
    }

    run(context) {

        const issues = [];

        const count =
            context.metrics.circularDependencies || 0;

        if (count > 0) {

            issues.push(

                this.issue(

                    "error",

                    "Circular Dependencies",

                    `${count} circular dependencies detected.`

                )

            );

        }

        return issues;

    }

}

module.exports = CircularRule;
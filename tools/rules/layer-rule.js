const BaseRule = require("./base-rule");

class LayerRule extends BaseRule {

    constructor() {
        super("Layer Rule");
    }

    run(context) {

        const issues = [];

        const violations =
            context.metrics.architectureViolations || 0;

        if (violations > 0) {

            issues.push(

                this.issue(

                    "warning",

                    "Layer Violations",

                    `${violations} layer violations detected.`

                )

            );

        }

        return issues;

    }

}

module.exports = LayerRule;
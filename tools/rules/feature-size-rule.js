const BaseRule = require("./base-rule");

class FeatureSizeRule extends BaseRule {

    constructor() {
        super("Feature Size");
    }

    run(context) {

        const issues = [];

        const modules =
            context.metrics.modules || 0;

        if (modules > 300) {

            issues.push(

                this.issue(

                    "warning",

                    "Large Project",

                    `Project contains ${modules} modules. Consider splitting large features.`

                )

            );

        }

        return issues;

    }

}

module.exports = FeatureSizeRule;
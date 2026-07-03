const BaseRule = require("./base-rule");

class SharedRule extends BaseRule {

    constructor() {
        super("Shared Pollution");
    }

    run() {

        return [];

    }

}

module.exports = SharedRule;
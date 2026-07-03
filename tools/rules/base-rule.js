class BaseRule {

    constructor(name) {
        this.name = name;
    }

    run() {
        return [];
    }

    issue(level, title, description, file = null) {
        return {
            rule: this.name,
            level,
            title,
            description,
            file
        };
    }

}

module.exports = BaseRule;
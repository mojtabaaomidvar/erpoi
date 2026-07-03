module.exports = [

    new (require("./circular-rule"))(),

    new (require("./layer-rule"))(),

    new (require("./shared-rule"))(),
	new (require("./large-file-rule"))(),
    new (require("./feature-size-rule"))()

];
module.exports={

    build:new (require("./build-parser"))(),

    tsc:new (require("./tsc-parser"))(),

    eslint:new (require("./eslint-parser"))(),

    dependency:new (require("./dependency-parser"))(),

    graphify:new (require("./graphify-parser"))(),

    madge:new (require("./madge-parser"))(),

    knip:new (require("./knip-parser"))()

};
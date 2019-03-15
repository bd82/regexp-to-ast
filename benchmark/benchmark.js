const Benchmark = require("benchmark")
const _ = require("lodash")
const samples = require("./samples")
const PublishedRegExpParser = require("regexp-to-ast").RegExpParser
const RegExpParser = require("../lib/regexp-to-ast").RegExpParser

const publishedParser = new PublishedRegExpParser()
const currentParser = new RegExpParser()

function newSuite(name) {
    return new Benchmark.Suite(name, {
        onStart: () => console.log(`\n\n${name}`),
        onCycle: event => console.log(String(event.target)),
        onComplete: function() {
            console.log("Fastest is " + this.filter("fastest").map("name"))
        }
    })
}

function bench(parser) {
    _.forEach(samples, patternContent => {
        try {
            parser.pattern(patternContent)
        } catch (error) {
            console.log(patternContent)
            console.log(error)
        }
    })
}

newSuite("regexp-to-ast Benchmark")
    .add("Published version", () => bench(publishedParser))
    .add("Current version", () => bench(currentParser))
    .run({
        async: false,
        minSamples: 200
    })

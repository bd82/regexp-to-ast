// references
// https://hackernoon.com/the-madness-of-parsing-real-world-javascript-regexps-d9ee336df983
// https://www.ecma-international.org/ecma-262/8.0/index.html#prod-Pattern

class regExpParser {

    constructor(input) {
        this.idx = 0
        this.input = input
    }

    peekChar(howMuch = 0) {
        return this.input[this.idx + howMuch]
    }

    consumeChar() {
        this.idx++
    }

    parse() {
        return this.disjunction()
    }

    disjunction() {
        const alts = []
        alts.push(this.alternative())

        while (this.peekChar() === '|') {
            this.consumeChar()
            alts.push(this.alternative())
        }

        return {type: "disjunction", alts}
    }

    alternative() {
        const terms = []


        return {type: "alternative", terms}
    }

    term() {

    }

    assertion() {

    }

    quantifier() {

    }

    quantifierPrefix() {

    }

    atom() {

    }

    isTerm() {
        return this.isAtom() || this.isAssertion()
    }

    isAtom() {
        if (this.isPatternCharacter()) {
            return true
        }

        switch (this.peekChar(0)) {
            case ".":
            case "\\": // atomEscape
            case "[": // characterClass
            // TODO: isAtom must be called before isAssertion - disambiguate
            case "(": // group
                return true
            default:
                return false
        }

    }

    isAssertion() {
        switch (this.peekChar(0)) {
            case "^":
            case "$":
                return true
            // '\b' or '\B'
            case "\\":
                switch (this.peekChar(1)) {
                    case "b":
                    case "B":
                        return true
                    default:
                        return false
                }
            // '(?=' or '(?!'
            case "(":
                return (this.peekChar(1) === "?" &&
                    (this.peekChar(2) === "=" || this.peekChar(2) === "!"))
            default:
                return false
        }
    }

    isQuantifier() {

    }

    isPatternCharacter() {
        switch (this.peekChar()) {
            case "^":
            case "$":
            case "\\":
            case ".":
            case "*":
            case "+":
            case "?":
            case "(":
            case ")":
            case "[":
            case "]":
            case "{":
            case "}":
            case "|":
                return false
            default:
                return true
        }
    }
}


// references
// https://hackernoon.com/the-madness-of-parsing-real-world-javascript-regexps-d9ee336df983
// https://www.ecma-international.org/ecma-262/8.0/index.html#prod-Pattern

class RegExpParser {
    pattern(input) {
        this.idx = 0
        this.input = input

        this.consumeChar("/")
        const value = this.disjunction()
        this.consumeChar("/")

        const flags = {
            global: false,
            ignoreCase: false,
            multiLine: false,
            unicode: false,
            sticky: false
        }

        while (this.isRegExpFlag()) {
            switch (this.popChar()) {
                case "g":
                    addFlag(flags, "global")
                    break
                case "i":
                    addFlag(flags, "ignoreCase")
                    break
                case "m":
                    addFlag(flags, "multiLine")
                    break
                case "u":
                    addFlag(flags, "unicode")
                    break
                case "y":
                    addFlag(flags, "sticky")
                    break
            }
        }
        return { type: "Pattern", flags: flags, value: value }
    }

    disjunction() {
        const alts = []
        alts.push(this.alternative())

        while (this.peekChar() === "|") {
            this.consumeChar("|")
            alts.push(this.alternative())
        }

        return { type: "Disjunction", value: alts }
    }

    alternative() {
        const terms = []

        while (this.isTerm()) {
            terms.push(this.term())
        }

        return { type: "Alternative", value: terms }
    }

    term() {
        let value, quantifier

        if (this.isAssertion()) {
            value = this.assertion()
        } else {
            value = this.atom()
            if (this.isQuantifier()) {
                quantifier = this.quantifier()
            }
        }

        const termAst = { type: "Term", value: value }
        if (quantifier !== undefined) {
            termAst.quantifier = quantifier
        }
        return termAst
    }

    assertion() {
        switch (this.popChar()) {
            case "^":
                return { type: "StartAnchor" }
            case "$":
                return { type: "EndAnchor" }
            // '\b' or '\B'
            case "\\":
                switch (this.popChar()) {
                    case "b":
                        return { type: "WordBoundary" }
                    case "B":
                        return { type: "NonWordBoundary" }
                    default:
                        throw Error("TBD")
                }
            // '(?=' or '(?!'
            case "(":
                switch (this.popChar()) {
                    case "?":
                        let type
                        switch (this.popChar()) {
                            case "=":
                                type = "Lookahead"
                                break
                            case "!":
                                type = "NegativeLookahead"
                                break
                            default:
                                throw Error("TBD")
                        }

                        const disjunction = this.disjunction()

                        switch (this.popChar()) {
                            case ")":
                                break
                            default:
                                throw Error("TBD")
                        }

                        return { type: type, disjunction: disjunction }
                    default:
                        throw Error("TBD")
                }
            default:
                throw Error("TBD")
        }
    }

    quantifier() {
        let type
        let result
        switch (this.popChar()) {
            case "*":
                result = { type: "ZeroOrMore" }
                break
            case "+":
                result = { type: "OneOrMore" }
                break
            case "?":
                result = { type: "ZeroOrOne" }
                break
            case "{":
                const atLeast = this.positiveInteger()
                switch (this.popChar()) {
                    case "}":
                        type = "ExactReps"
                        atMost = atLeast
                        break
                    case ",":
                        let atMost
                        if (this.isPositiveInteger()) {
                            atMost = this.positiveInteger()
                            type = "ClosedRangeReps"
                        } else {
                            atMost = Infinity
                            type = "AtLeastReps"
                        }
                        switch (this.popChar()) {
                            case "}":
                                result = {
                                    type: type,
                                    atLeast: atLeast,
                                    atMost: atMost
                                }
                                break
                            default:
                                throw Error("TBD")
                        }
                        break
                    default:
                        throw Error("TBD")
                }
                break
            default:
                throw Error("TBD")
        }

        if (this.peekChar(0) === "?") {
            this.consumeChar("?")
            result.greedy = false
        } else {
            result.greedy = true
        }

        return result
    }

    atom() {
        switch (this.peekChar()) {
            case ".":
                return this.dotAll()
            case "\\":
                return this.atomEscape()
            case "[":
                return this.characterClass()
            case "(":
                return this.group()
            default:
                if (this.isPatternCharacter()) {
                    return this.patternCharacter()
                }
                throw Error("TBD")
        }
    }

    dotAll() {
        this.consumeChar(".")
        return {
            type: "Set",
            complement: true,
            value: [cc("\n"), cc("\r"), cc("\u2028"), cc("\u2029")]
        }
    }

    atomEscape() {
        this.consumeChar("\\")

        switch (this.peekChar()) {
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
                return this.decimalEscapeAtom()
            case "f":
            case "n":
            case "r":
            case "t":
            case "v":
                return this.controlEscapeAtom()
            case "c":
                return this.controlLetterEscapeAtom()
            case "0":
                return this.nulCharacterAtom()
            case "x":
                return this.hexEscapeSequenceAtom()
            case "u":
                return this.regExpUnicodeEscapeSequenceAtom()
            default:
                return this.identityEscapeAtom()
        }
    }

    decimalEscapeAtom() {
        const value = this.positiveInteger()

        return { type: "GroupBackReference", value: value }
    }

    controlEscapeAtom() {
        let escapeCode
        switch (this.popChar()) {
            case "f":
                escapeCode = cc("\f")
                break
            case "n":
                escapeCode = cc("\n")
                break
            case "r":
                escapeCode = cc("\r")
                break
            case "t":
                escapeCode = cc("\t")
                break
            case "v":
                escapeCode = cc("\v")
                break
            default:
                throw Error("TBD")
        }

        return { type: "Character", value: escapeCode }
    }

    controlLetterEscapeAtom() {
        this.consumeChar("c")
        const letter = this.popChar()
        if (/[a-zA-Z]/.test(letter) === false) {
            throw Error("TBD")
        }

        const letterCode = letter.toUpperCase().charCodeAt(0) - 64
        return { type: "Character", value: letterCode }
    }

    nulCharacterAtom() {
        // TODO implement '[lookahead ∉ DecimalDigit]'
        // TODO: for the deprecated octal escape sequence
        this.consumeChar("0")
        return { type: "Character", value: cc("\0") }
    }

    hexEscapeSequenceAtom() {
        this.consumeChar("x")
        return this.parseHexDigits(2)
    }

    regExpUnicodeEscapeSequenceAtom() {
        this.consumeChar("u")
        return this.parseHexDigits(4)
    }

    identityEscapeAtom() {
        // TODO: implement "SourceCharacter but not UnicodeIDContinue"
        // // http://unicode.org/reports/tr31/#Specific_Character_Adjustments
        const escapedChar = this.popChar()
        return { type: "Character", value: cc(escapedChar) }
    }

    patternCharacterAtom() {
        switch (this.peekChar()) {
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
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
                throw Error("TBD")
            default:
                const nextChar = this.popChar()
                return { type: "Character", value: cc(nextChar) }
        }
    }

    characterClass() {
        const set = []
        let complement = false
        this.consumeChar("[")
        if (this.peekChar(0) === "^") {
            this.consumeChar("^")
            complement = true
        }

        while (this.isClassAtom()) {
            const from = this.classAtom().value
            if (this.isRangeDash()) {
                this.consumeChar("-")
                const to = this.classAtom().value
                if (to < from) {
                    throw Error("Range out of order in character class")
                }
                for (let charCode = from; i <= to; i++) {
                    set.push(charCode)
                }
            } else {
                set.push(from)
            }
        }

        this.consumeChar("]")

        return { type: "Set", complement, value: uniq(set) }
    }

    classAtom() {
        switch (this.peekChar()) {
            case "]":
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
                throw Error("TBD")
            case "\\":
                return this.classEscape()
            default:
                return this.patternCharacterAtom()
        }
    }

    classEscape() {
        this.consumeChar("\\")
        switch (this.peekChar()) {
            // Matches a backspace.
            // (Not to be confused with \b word boundary outside characterClass)
            case "b":
                return { type: "character", value: "\u0008" }
            case "f":
            case "n":
            case "r":
            case "t":
            case "v":
                return this.controlEscapeAtom()
            case "c":
                return this.controlLetterEscapeAtom()
            case "0":
                return this.nulCharacterAtom()
            case "x":
                return this.hexEscapeSequenceAtom()
            case "u":
                return this.regExpUnicodeEscapeSequenceAtom()
            default:
                return this.identityEscapeAtom()
        }
    }

    group() {
        let capturing = true
        this.consumeChar("(")
        switch (this.peekChar(0)) {
            case "?":
                this.consumeChar("?")
                this.consumeChar(":")
                capturing = false
                break
            default:
                break
        }
        const value = this.disjunction()
        this.consumeChar(")")

        return { type: group, capturing: capturing, value: value }
    }

    positiveInteger() {
        let number = this.popChar()
        if (decimalPatternNoZero.test(number) === false) {
            throw Error("TBD")
        }

        while (decimalPattern.test(this.peekChar(0))) {
            number += this.popChar()
        }

        return parseInt(number, 10)
    }

    patternCharacter() {
        const nextChar = this.popChar()
        switch (nextChar) {
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
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
                throw Error("TBD")
            default:
                return { type: "character", value: cc(nextChar) }
        }
    }
    isRegExpFlag() {
        switch (this.peekChar(0)) {
            case "g":
            case "i":
            case "m":
            case "u":
            case "y":
                return true
            default:
                return false
        }
    }

    isRangeDash() {
        return this.peekChar() === "-" && this.isClassAtom(1)
    }

    isPositiveInteger() {
        return decimalPatternNoZero.test(this.peekChar(0))
    }

    isClassAtom(howMuch = 0) {
        switch (this.peekChar(howMuch)) {
            case "]":
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
                return false
            default:
                return true
        }
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
                return (
                    this.peekChar(1) === "?" &&
                    (this.peekChar(2) === "=" || this.peekChar(2) === "!")
                )
            default:
                return false
        }
    }

    isQuantifier() {
        switch (this.peekChar()) {
            case "*":
            case "+":
            case "?":
            case "{":
                return true
            default:
                return false
        }
    }

    isPatternCharacter() {
        switch (this.peekChar()) {
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
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
            case "/":
                return false
            default:
                return true
        }
    }

    parseHexDigits(howMany) {
        let hexString = ""
        for (let i = 0; i < howMany; i++) {
            const hexChar = this.popChar()
            if (hexDigitPattern.test(hexChar) === false) {
                throw Error("TBD")
            }
            hexString += hexChar
        }
        const charCode = parseInt(hexString, 16)
        return { type: "character", value: charCode }
    }

    peekChar(howMuch = 0) {
        return this.input[this.idx + howMuch]
    }

    popChar() {
        const nextChar = this.peekChar(0)
        this.consumeChar()
        return nextChar
    }

    consumeChar(char) {
        if (char !== undefined && this.input[this.idx] !== char) {
            throw Error(
                "Expected: '" +
                    char +
                    "' but found: '" +
                    this.input[this.idx] +
                    "' at offset: " +
                    this.idx
            )
        }

        if (this.idx >= this.input.length) {
            throw Error("Unexpected end of input")
        }
        this.idx++
    }
}

const hexDigitPattern = /[0-9a-fA-F]/
const decimalPattern = /[0-9]/
const decimalPatternNoZero = /[1-9]/

function cc(char) {
    return char.charCodeAt(0)
}

function uniq(arr) {
    const setMap = {}
    arr.forEach(item => (setMap[item] = item))

    const set = []
    for (var key in setMap) {
        set.push(setMap[key])
    }

    return set
}

function addFlag(flagObj, flagKey) {
    if (flagObj[flagKey] === true) {
        throw `duplicate flag ${flagKey}`
    }

    flagObj[flagKey] = true
}

module.exports = {
    RegExpParser: RegExpParser
}

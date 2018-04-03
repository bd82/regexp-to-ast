const { RegExpParser } = require("../lib/parser")
const { expect } = require("chai")

describe("The RegExp to Ast parser", () => {
    let parser

    before(() => {
        parser = new RegExpParser()
    })

    it("can parse a simple regExp with a single alternative", () => {
        const ast = parser.pattern("/abc/")
        expect(ast).to.deep.equal({
            type: "Pattern",
            flags: {
                global: false,
                ignoreCase: false,
                multiLine: false,
                unicode: false,
                sticky: false
            },
            value: {
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97
                            },
                            {
                                type: "character",
                                value: 98
                            },
                            {
                                type: "character",
                                value: 99
                            }
                        ]
                    }
                ]
            }
        })
    })

    it("can parse an empty regExp", () => {
        const ast = parser.pattern("/(?:)/")
        expect(ast).to.deep.equal({
            type: "Pattern",
            flags: {
                global: false,
                ignoreCase: false,
                multiLine: false,
                unicode: false,
                sticky: false
            },
            value: {
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "Group",
                                capturing: false,
                                idx: 0,
                                value: {
                                    type: "Disjunction",
                                    value: [
                                        {
                                            type: "Alternative",
                                            value: []
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ]
            }
        })
    })
})

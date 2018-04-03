const { RegExpParser } = require("../lib/parser")
const { expect } = require("chai")

describe("The RegExp to Ast parser", () => {
    let parser

    before(() => {
        parser = new RegExpParser()
    })

    context("can parse", () => {
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

        context("flags", () => {
            it("global", () => {
                const ast = parser.pattern("/(?:)/g")
                expect(ast.flags).to.deep.equal({
                    global: true,
                    ignoreCase: false,
                    multiLine: false,
                    unicode: false,
                    sticky: false
                })
            })

            it("ignoreCase", () => {
                const ast = parser.pattern("/(?:)/i")
                expect(ast.flags).to.deep.equal({
                    global: false,
                    ignoreCase: true,
                    multiLine: false,
                    unicode: false,
                    sticky: false
                })
            })

            it("multiLine", () => {
                const ast = parser.pattern("/(?:)/m")
                expect(ast.flags).to.deep.equal({
                    global: false,
                    ignoreCase: false,
                    multiLine: true,
                    unicode: false,
                    sticky: false
                })
            })

            it("unicode", () => {
                const ast = parser.pattern("/(?:)/u")
                expect(ast.flags).to.deep.equal({
                    global: false,
                    ignoreCase: false,
                    multiLine: false,
                    unicode: true,
                    sticky: false
                })
            })

            it("ignoreCase", () => {
                const ast = parser.pattern("/(?:)/y")
                expect(ast.flags).to.deep.equal({
                    global: false,
                    ignoreCase: false,
                    multiLine: false,
                    unicode: false,
                    sticky: true
                })
            })

            it("none", () => {
                const ast = parser.pattern("/(?:)/")
                expect(ast.flags).to.deep.equal({
                    global: false,
                    ignoreCase: false,
                    multiLine: false,
                    unicode: false,
                    sticky: false
                })
            })

            it("all", () => {
                const ast = parser.pattern("/(?:)/gimuy")
                expect(ast.flags).to.deep.equal({
                    global: true,
                    ignoreCase: true,
                    multiLine: true,
                    unicode: true,
                    sticky: true
                })
            })

            it("duplicates", () => {
                const parse = () => parser.pattern("/(?:)/gig")
                expect(parse).to.throw("duplicate flag global")
            })

            it("unrecognized", () => {
                const parse = () => parser.pattern("/(?:)/x")
                expect(parse).to.throw("Redundant input: x")
            })
        })

        context("alternatives", () => {
            it("single", () => {
                const ast = parser.pattern("/abc/")
                expect(ast.value).to.deep.equal({
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
                })
            })

            it("multiple", () => {
                const ast = parser.pattern("/a|b|c/")
                expect(ast.value).to.deep.equal({
                    type: "Disjunction",
                    value: [
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "character",
                                    value: 97
                                }
                            ]
                        },
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "character",
                                    value: 98
                                }
                            ]
                        },
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "character",
                                    value: 99
                                }
                            ]
                        }
                    ]
                })
            })

            it("empty alternative", () => {
                const ast = parser.pattern("/a||c/")
                expect(ast.value).to.deep.equal({
                    type: "Disjunction",
                    value: [
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "character",
                                    value: 97
                                }
                            ]
                        },
                        {
                            type: "Alternative",
                            value: []
                        },
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "character",
                                    value: 99
                                }
                            ]
                        }
                    ]
                })
            })
        })

        context("assertions", () => {
            it("startAnchor", () => {
                const ast = parser.pattern("/^a/")
                expect(ast.value).to.deep.equal({
                    type: "Disjunction",
                    value: [
                        {
                            type: "Alternative",
                            value: [
                                {
                                    type: "StartAnchor"
                                },
                                {
                                    type: "character",
                                    value: 97
                                }
                            ]
                        }
                    ]
                })
            })

            it("endAnchor", () => {
                const ast = parser.pattern("/a$/")
                expect(ast.value).to.deep.equal({
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
                                    type: "EndAnchor"
                                }
                            ]
                        }
                    ]
                })
            })

            it("word boundary", () => {
                const ast = parser.pattern("/a\\b/")
                expect(ast.value).to.deep.equal({
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
                                    type: "WordBoundary"
                                }
                            ]
                        }
                    ]
                })
            })

            it("NonWord boundary", () => {
                const ast = parser.pattern("/a\\B/")
                expect(ast.value).to.deep.equal({
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
                                    type: "NonWordBoundary"
                                }
                            ]
                        }
                    ]
                })
            })

            it("lookahead assertion", () => {
                const ast = parser.pattern("/a(?=b)/")
                expect(ast.value).to.deep.equal({
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
                                    type: "Lookahead",
                                    value: {
                                        type: "Disjunction",
                                        value: [
                                            {
                                                type: "Alternative",
                                                value: [
                                                    {
                                                        type: "character",
                                                        value: 98
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                })
            })

            it("lookahead assertion", () => {
                const ast = parser.pattern("/a(?!b)/")
                expect(ast.value).to.deep.equal({
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
                                    type: "NegativeLookahead",
                                    value: {
                                        type: "Disjunction",
                                        value: [
                                            {
                                                type: "Alternative",
                                                value: [
                                                    {
                                                        type: "character",
                                                        value: 98
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    ]
                })
            })
        })
    })

    context("quantifiers", () => {
        it("zero or one", () => {
            const ast = parser.pattern("/a?/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 0,
                                    atMost: 1,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("star", () => {
            const ast = parser.pattern("/a*/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 0,
                                    atMost: Infinity,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("plus", () => {
            const ast = parser.pattern("/a+/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 1,
                                    atMost: Infinity,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("exactlyX", () => {
            const ast = parser.pattern("/a{6}/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 6,
                                    atMost: 6,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("atLeastX", () => {
            const ast = parser.pattern("/a{2,}/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 2,
                                    atMost: Infinity,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("atLeastXAtMostY", () => {
            const ast = parser.pattern("/a{8,12}/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 8,
                                    atMost: 12,
                                    greedy: true
                                }
                            }
                        ]
                    }
                ]
            })
        })

        it("nonGreedy", () => {
            const ast = parser.pattern("/a??/")
            expect(ast.value).to.deep.equal({
                type: "Disjunction",
                value: [
                    {
                        type: "Alternative",
                        value: [
                            {
                                type: "character",
                                value: 97,
                                quantifier: {
                                    type: "Quantifier",
                                    atLeast: 0,
                                    atMost: 1,
                                    greedy: false
                                }
                            }
                        ]
                    }
                ]
            })
        })
    })
})

"use strict"

const config = require("./release_config")
const git = require("gitty")
const _ = require("lodash")
const semver = require("semver")
const jf = require("jsonfile")
const fs = require("fs")

const myRepo = git("")
const status = myRepo.statusSync()

// Checks and Validations
if (
    !_.isEmpty(status.staged) ||
    !_.isEmpty(status.unstaged) ||
    !_.isEmpty(status.untracked)
) {
    console.log(
        "Error: git working directory must be clean in order to perform a release"
    )
    process.exit(-1)
}

const branchesInfo = myRepo.getBranchesSync()

if (branchesInfo.current !== "master") {
    console.log(
        "Error: can only perform release job from master or temp_master branch"
    )
    process.exit(-1)
}

const dateTemplateRegExp = /^(## X\.Y\.Z )\(INSERT_DATE_HERE\)/
if (!dateTemplateRegExp.test(config.changeLogString)) {
    console.log(
        "CHANGELOG.md must have first line in the format '## X.Y.Z (INSERT_DATE_HERE)'"
    )
    process.exit(-1)
}

// bump package.json
const newVersion = semver.inc(config.currVersion, config.mode)
const bumpedPkgJson = _.clone(config.pkgJson)
bumpedPkgJson.version = newVersion
jf.writeFileSync(config.packagePath, bumpedPkgJson, { spaces: 2, EOL: "\r\n" })

// bump version insider parser.js
const parserText = fs.readFileSync(config.parserPath, "utf8")
const updatedVersionParserText = parserText.replace(
    `VERSION: "${config.currVersion}"`,
    `VERSION: "${newVersion}"`
)
fs.writeFileSync(config.parserPath, updatedVersionParserText)

// update CHANGELOG.md date
const nowDate = new Date()
const nowDateString = nowDate.toLocaleDateString().replace(/\//g, "-")
const changeLogDate = config.changeLogString.replace(
    dateTemplateRegExp,
    `## ${newVersion} (${nowDateString})`
)
fs.writeFileSync(config.changeLogPath, changeLogDate)

// Create commit and push to master
const newTagName = config.tagPrefix + newVersion

myRepo.addSync([config.packagePath, config.changeLogPath, config.htmlDocsPath, config.parserPath])
myRepo.commitSync(`release ${newVersion}`)
myRepo.createTagSync(newTagName)
myRepo.push("origin", "master", () => {
    console.log("finished push to branch")
})
myRepo.push("origin", newTagName, () => {
    console.log("finished push tag")
})

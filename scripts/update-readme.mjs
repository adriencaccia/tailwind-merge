// This file can only be executed with zx. More info: https://github.com/google/zx

// @ts-check

import 'zx/globals'

import packageJson from '../package.json' assert { type: 'json' }

$.verbose = true

updateReadme()

async function updateReadme() {
    const ROOT_PATH = `${__dirname}/..`
    const README_PATH = `${ROOT_PATH}/README.md`
    const DOCS_OVERVIEW_PATH = `${ROOT_PATH}/docs/README.md`

    const [currentReadmeContent, currentDocsOverviewContent] = await Promise.all([
        fs.readFile(README_PATH, { encoding: 'utf-8' }),
        fs.readFile(DOCS_OVERVIEW_PATH, { encoding: 'utf-8' }),
    ])

    const nextReadme = pipe(
        currentDocsOverviewContent,
        applyStaticLinks,
        addAutoGeneratedInfoComment,
    )

    if (nextReadme !== currentReadmeContent) {
        await fs.writeFile(README_PATH, nextReadme)
    }

    await $`git add README.md`
}

/**
 * @param {string} docsOverviewContent
 * @returns {string}
 */
function applyStaticLinks(docsOverviewContent) {
    const version = getVersion()

    const nextDocsOverviewContent = docsOverviewContent
        .replace(
            /(["'`(])\.\.\/(assets\/[^\s]+)(["'`)])/g,
            `$1https://github.com/dcastil/tailwind-merge/raw/${version}/$2$3`,
        )
        .replace(
            /(["'`(])\.\/([^\s]+\.md)(["'`)])/g,
            `$1https://github.com/dcastil/tailwind-merge/tree/${version}/docs/$2$3`,
        )

    if (nextDocsOverviewContent === docsOverviewContent) {
        throw Error(`${chalk.red('[ERROR]')} Did not update anything in docs overview file.`)
    }

    return nextDocsOverviewContent
}

function getVersion() {
    const gitRefVersionRegex = /^\d+.\d+.\d+-[^.]+\.(?<gitRef>[\da-f]+)$/

    return (
        packageJson.version.match(gitRefVersionRegex)?.groups?.gitRef || 'v' + packageJson.version
    )
}

function addAutoGeneratedInfoComment(content) {
    return (
        '<!-- This file is autogenerated. If you want to change this content, please do the changes in `./docs/README.md` instead. -->\n\n' +
        content
    )
}

/**
 * @param {string} argument
 * @param {((arg: string) => string)[]} functions
 * @returns {string}
 */
function pipe(argument, ...functions) {
    return functions.reduce((argument, fn) => fn(argument), argument)
}

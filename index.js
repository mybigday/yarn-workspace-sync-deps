#! /usr/bin/env node

const argv = require('minimist')(process.argv.slice(2), {
  string: ['others'],
})

const fs = require('fs')
const path = require('path')
const rootPkg = require(path.join(process.cwd(), '/package.json'))

const allDeps = Object.assign({}, rootPkg.dependencies, rootPkg.devDependencies)

const findDependencies = dependency =>
  Object.keys(allDeps).findIndex(d => d === dependency) >= 0 &&
  allDeps[dependency]

const log = (name, info) => console.log(`[${name}]`, info)
const warn = (name, info) => console.warn(`[${name}]`, info)
const error = (name, info) => console.error(`[${name}]`, info)

const updateDependencies = (name, deps) => {
  if (!deps) return
  Object.keys(deps).forEach(d => {
    const version = findDependencies(d)
    if (!version) {
      error(
        name,
        `Dependency \`${d}\` not found in root dependencies, please add it.`,
      )
      return
    }
    const mayOldVersion = deps[d]
    if (version !== mayOldVersion) {
      log(name, `Sync dependency \`${d}\`: ${mayOldVersion} -> ${version}`)
      deps[d] = version
    }
  })
}

const handleWorkspace = workspace => {
  const dirname = workspace.replace(/\*/, '')
  const dirs = fs.readdirSync(dirname)

  dirs.forEach(dir => {
    const pkgPath = path.join(process.cwd(), dirname, dir, 'package.json')
    const pkg = require(pkgPath)

    if (pkg.devDependencies) {
      warn(pkg.name, 'has sub packages in devDependencies.')
    }
    if (!pkg.dependencies && !pkg.devDependencies) {
      log(pkg.name, 'No dependencies')
      return
    }

    updateDependencies(pkg.name, pkg.dependencies)
    updateDependencies(pkg.name, pkg.devDependencies)

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  })
}

let workspaces = [...rootPkg.workspaces]

if (argv.others) {
  workspaces = workspaces.concat(argv.others)
}

workspaces.forEach(handleWorkspace)

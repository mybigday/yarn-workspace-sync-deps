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

const updateDependencies = (name, deps, ignoredList) => {
  if (!deps) return
  Object.keys(deps).forEach(d => {
    const version = findDependencies(d)
    if (ignoredList.indexOf(d) >= 0) return
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
  let packages
  if (workspace.endsWith("*")) {
    const dirname = workspace.replace(/\*/, '')
    const dirs = fs.readdirSync(dirname)
    packages = dirs.map(dir => {
      const pkgPath = path.join(process.cwd(), dirname, dir, 'package.json')
      const pkg = require(pkgPath)
      pkg._path = pkgPath
      return pkg
    })
  } else {
    const pkgPath = path.join(process.cwd(), workspace, 'package.json')
    const pkg = require(pkgPath)
    pkg._path = pkgPath
    packages = [ pkg ]
  }
  const nameList = packages.map(pkg => pkg.name)
  packages.forEach(pkg => {
    if (pkg.devDependencies) {
      warn(pkg.name, 'has sub packages in devDependencies.')
    }
    if (!pkg.dependencies && !pkg.devDependencies) {
      log(pkg.name, 'No dependencies')
      return
    }

    updateDependencies(pkg.name, pkg.dependencies, nameList)
    updateDependencies(pkg.name, pkg.devDependencies, nameList)

    const pkgPath = pkg._path
    delete pkg._path
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  })
}

let workspaces = [...rootPkg.workspaces]

if (argv.others) {
  workspaces = workspaces.concat(argv.others)
}

workspaces.forEach(handleWorkspace)

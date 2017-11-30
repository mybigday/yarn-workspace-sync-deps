#! /usr/bin/env node

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

const handleWorkspace = workspace => {
  const dirname = workspace.replace(/\*/, '')
  const dirs = fs.readdirSync(dirname)

  dirs.forEach(dir => {
    const pkgPath = path.join(process.cwd(), dirname, dir, 'package.json')
    const pkg = require(pkgPath)

    if (pkg.devDependencies) {
      warn(
        pkg.name,
        "Sub packages doesn't need devDependencies, please remove it.",
      )
    }
    if (!pkg.dependencies) {
      log(pkg.name, 'No dependencies')
      return
    }
    Object.keys(pkg.dependencies).forEach(d => {
      const version = findDependencies(d)
      if (!version) {
        error(
          pkg.name,
          `Dependency \`${d}\` not found in root dependencies, please add it.`,
        )
      }
      const mayOldVersion = pkg.dependencies[d]
      if (version !== mayOldVersion) {
        log(
          pkg.name,
          `Sync dependency \`${d}\`: ${mayOldVersion} -> ${version}`,
        )
        pkg.dependencies[d] = version
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
      }
    })
  })
}

rootPkg.workspaces.forEach(handleWorkspace)

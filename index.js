#! /usr/bin/env node

const argv = require('minimist')(process.argv.slice(2), {
  string: ['others', 'ignore'],
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

const ignore = (argv.ignore || process.env.YARN_SYNC_IGNORE) &&
  new RegExp(argv.ignore|| process.env.YARN_SYNC_IGNORE)

const skip = (argv.skip || process.env.YARN_SYNC_SKIP) &&
  new RegExp(argv.skip|| process.env.YARN_SYNC_SKIP)

const fix = !!(argv.fix || process.env.YARN_SYNC_FIX)

let rootChanged = false

const updateDependencies = (name, deps, ignoredList) => {
  if (!deps) return
  Object.keys(deps).forEach(d => {
    const version = findDependencies(d)
    if (ignoredList.indexOf(d) >= 0) return
    if (!version) {
      if (ignore && ignore.test(d)) return
      if (fix) {
        if (isDev) {
          rootDevDeps[d] = deps[d]
        } else {
          rootDeps[d] = deps[d]
        }
        ignoredList.push(d)
        rootChanged = true
      } else {
        error(
          name,
          `Dependency \`${d}\` not found in root dependencies, please add it. Run with --fix to add automatically`,
        )
      }
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
  if (workspace.endsWith('*')) {
    const dirname = workspace.replace(/\*/, '')
    const dirs = fs.readdirSync(dirname)
    packages = dirs.map(dir => {
      const pkgPath = path.join(process.cwd(), dirname, dir, 'package.json')
      if (fs.existsSync(pkgPath) && !(skip && skip.test(pkgPath))) {
        const pkg = require(pkgPath)
        pkg._path = pkgPath
        return pkg
      } else {
        return false
      }
    })
  } else {
    const pkgPath = path.join(process.cwd(), workspace, 'package.json')
    if (fs.existsSync(pkgPath) && !(skip && skip.test(pkgPath))) {
      const pkg = require(pkgPath)
      pkg._path = pkgPath
      packages = [pkg]
    } else {
      packages = []
    }
  }
  const nameList = packages.map(pkg => pkg.name)
  packages.forEach(pkg => {
    if (pkg.devDependencies) {
      warn(pkg.name, 'has sub packages in devDependencies.')
    }
    if (!pkg.dependencies && !pkg.devDependencies) {
      if (pkg.name !== undefined) {
        log(pkg.name, 'No dependencies')
      }
      return
    }

    updateDependencies(pkg.name, pkg.dependencies, nameList)
    updateDependencies(pkg.name, pkg.devDependencies, nameList)

    const pkgPath = pkg._path
    delete pkg._path
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  })
}

let workspaces = [
  ...(Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : rootPkg.workspaces.packages),
]

if (argv.others) {
  workspaces = workspaces.concat(argv.others)
}

workspaces.forEach(handleWorkspace)

if (rootChanged) {
  rootPkg.dependencies = Object.keys(rootDeps)
    .sort()
    .reduce((acc, key) => {
      acc[key] = rootDeps[key]
      return acc
    }, {})
  rootPkg.devDependencies = Object.keys(rootDevDeps)
    .sort()
    .reduce((acc, key) => {
      acc[key] = rootDevDeps[key]
      return acc
    }, {})
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n')
}
const fs = require('fs')
const path = require('path')
const shell = require('shelljs')

test('yarn-workspace-sync-deps', () => {
  const matchSnaps = () => {
    expect(
      fs.readFileSync(
        path.join(__dirname, 'fixture/test/test-package1/package.json'),
        'utf-8',
      ),
    ).toMatchSnapshot()
    expect(
      fs.readFileSync(
        path.join(__dirname, 'fixture/test2/test2-package1/package.json'),
        'utf-8',
      ),
    ).toMatchSnapshot()
    expect(
      fs.readFileSync(
        path.join(__dirname, 'fixture/test3/test3-package1/package.json'),
        'utf-8',
      ),
    ).toMatchSnapshot()
  }

  shell.cd(path.join(__dirname, 'fixture/'))
  matchSnaps()
  shell.exec('yarn')
  matchSnaps()
  shell.exec('git checkout .')
})

test("yarn-workspace-sync-deps named workspaces with no wild cards", () => {
  const matchSnaps = () => {
    expect(
        fs.readFileSync(
            path.join(__dirname, 'fixture/test4/test4-package1/package.json'),
            'utf-8',
        ),
    ).toMatchSnapshot()
    expect(
        fs.readFileSync(
            path.join(__dirname, 'fixture/test4/test4-package2/package.json'),
            'utf-8',
        ),
    ).toMatchSnapshot()
    expect(
        fs.readFileSync(
            path.join(__dirname, 'fixture/test4/packages/test4-package3/package.json'),
            'utf-8',
        ),
    ).toMatchSnapshot()
    expect(
        fs.readFileSync(
            path.join(__dirname, 'fixture/test4/packages/test4-package4/package.json'),
            'utf-8',
        ),
    ).toMatchSnapshot()
  }

  shell.cd(path.join(__dirname, 'fixture/test4'))
  matchSnaps()
  shell.exec('yarn')
  matchSnaps()
  shell.exec('git checkout .')
})
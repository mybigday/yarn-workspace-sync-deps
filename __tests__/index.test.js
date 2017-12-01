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
  }

  shell.cd(path.join(__dirname, 'fixture/'))
  matchSnaps()
  shell.exec('yarn')
  matchSnaps()
  shell.exec('git checkout .')
})
